import argparse
import json
import os
import tempfile
import sys
import wave


def _decode_audio_to_pcm_chunks(file_path: str, chunk_seconds: int):
    import av
    from av.audio.resampler import AudioResampler

    container = av.open(file_path)
    audio_stream = next((stream for stream in container.streams if stream.type == "audio"), None)

    if audio_stream is None:
        container.close()
        raise ValueError("No audio stream found in uploaded file")

    sample_rate = 16000
    bytes_per_sample = 2
    max_chunk_bytes = max(1, chunk_seconds) * sample_rate * bytes_per_sample

    resampler = AudioResampler(format="s16", layout="mono", rate=sample_rate)
    chunk_bytes = bytearray()

    for frame in container.decode(audio_stream):
        for resampled in resampler.resample(frame):
            array = resampled.to_ndarray()
            pcm_bytes = array.tobytes()
            chunk_bytes.extend(pcm_bytes)

            while len(chunk_bytes) >= max_chunk_bytes:
                yield bytes(chunk_bytes[:max_chunk_bytes]), sample_rate
                del chunk_bytes[:max_chunk_bytes]

    if chunk_bytes:
        yield bytes(chunk_bytes), sample_rate

    container.close()


def _write_temp_wav(chunk_bytes: bytes, sample_rate: int) -> str:
    fd, temp_path = tempfile.mkstemp(prefix="meetflow-whisper-", suffix=".wav")
    os.close(fd)

    with wave.open(temp_path, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(chunk_bytes)

    return temp_path


def _transcribe_with_chunking(model, file_path: str, chunk_seconds: int):
    segment_list = []
    full_text_parts = []
    duration = 0.0
    global_id = 0
    chunk_start_offset = 0.0
    language = "unknown"
    chunks_processed = 0

    for chunk_bytes, sample_rate in _decode_audio_to_pcm_chunks(file_path, chunk_seconds):
        chunk_path = _write_temp_wav(chunk_bytes, sample_rate)

        try:
            segments, info = model.transcribe(
                chunk_path,
                beam_size=5,
                vad_filter=True,
            )

            if getattr(info, "language", None):
                language = info.language

            chunk_end = chunk_start_offset

            for segment in segments:
                text = (segment.text or "").strip()
                start = float(segment.start) + chunk_start_offset
                end = float(segment.end) + chunk_start_offset

                if not text:
                    chunk_end = max(chunk_end, end)
                    continue

                segment_list.append(
                    {
                        "id": global_id,
                        "start": start,
                        "end": end,
                        "text": text,
                    }
                )
                full_text_parts.append(text)
                duration = max(duration, end)
                chunk_end = max(chunk_end, end)
                global_id += 1

            chunk_start_offset = max(chunk_start_offset, chunk_end)
            chunks_processed += 1
        finally:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)

    return {
        "text": " ".join(full_text_parts).strip(),
        "segments": segment_list,
        "language": language,
        "duration": duration,
        "chunksProcessed": chunks_processed,
    }


def _transcribe_single_pass(model, file_path: str):
    segments, info = model.transcribe(
        file_path,
        beam_size=5,
        vad_filter=True,
    )

    segment_list = []
    full_text_parts = []
    duration = 0.0

    for idx, segment in enumerate(segments):
        text = (segment.text or "").strip()
        if not text:
            continue

        segment_list.append(
            {
                "id": idx,
                "start": float(segment.start),
                "end": float(segment.end),
                "text": text,
            }
        )
        full_text_parts.append(text)
        if segment.end > duration:
            duration = float(segment.end)

    return {
        "text": " ".join(full_text_parts).strip(),
        "segments": segment_list,
        "language": getattr(info, "language", "unknown") or "unknown",
        "duration": duration,
        "chunksProcessed": 1,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--model", default="base")
    parser.add_argument("--chunk-seconds", type=int, default=0)
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except Exception as exc:  # noqa: BLE001
        print(
            "faster-whisper is not installed. Run: pip install -r backend/requirements-whisper.txt",
            file=sys.stderr,
        )
        raise exc

    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    if args.chunk_seconds and args.chunk_seconds > 0:
        payload = _transcribe_with_chunking(model, args.file, args.chunk_seconds)
    else:
        payload = _transcribe_single_pass(model, args.file)

    print(json.dumps(payload))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)
