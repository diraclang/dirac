#!/usr/bin/env python3
import argparse
import base64
import json
import os
import sys
import urllib.request

DEFAULT_MODEL = "llava"
DEFAULT_PROMPT = "What is this image about?"
DEFAULT_URL = "http://localhost:11434/api/generate"


def read_image_as_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def ask_ollama_about_image(image_path: str, prompt: str, model: str, url: str) -> str:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    encoded = read_image_as_base64(image_path)
    payload = {
        "model": model,
        "prompt": prompt,
        "images": [encoded],
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    chunks = []
    with urllib.request.urlopen(request, timeout=120) as response:
        for line in response:
            try:
                obj = json.loads(line.decode("utf-8"))
            except Exception:
                continue
            text = obj.get("response")
            if text:
                chunks.append(text)
                print(text, end="", flush=True)

    print()
    return "".join(chunks)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ask a local Ollama vision model (e.g. llava) to describe an image."
    )
    parser.add_argument(
        "image",
        nargs="?",
        default="IMG_4678.png",
        help="Path to the image file (default: IMG_4678.png in the current directory)",
    )
    parser.add_argument(
        "--prompt",
        default=DEFAULT_PROMPT,
        help=f"Prompt to send to the model (default: {DEFAULT_PROMPT!r})",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Ollama model to use (default: {DEFAULT_MODEL!r})",
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("OLLAMA_GENERATE_URL", DEFAULT_URL),
        help=f"Ollama generate endpoint (default: {DEFAULT_URL})",
    )
    args = parser.parse_args()

    image_path = os.path.abspath(args.image)
    print(f"Image: {image_path}")
    print(f"Model: {args.model}")
    print(f"Prompt: {args.prompt}")
    print("---")

    try:
        ask_ollama_about_image(image_path, args.prompt, args.model, args.url)
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
