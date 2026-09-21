"""
Image Information and Processing Tool
======================================
Core functions for loading, inspecting, converting, resizing,
and saving images using Pillow.
"""

import os
import numpy as np
from PIL import Image


def load_image(path: str) -> Image.Image:
    """Load an image from disk and return a Pillow Image object."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Image not found: {path}")
    return Image.open(path)


def display_image(image: Image.Image) -> None:
    """Open the image in the system's default image viewer."""
    image.show()


def get_dimensions(image: Image.Image) -> tuple:
    """Return (width, height) of the image in pixels."""
    return image.size


def convert_to_grayscale(image: Image.Image) -> Image.Image:
    """Return a grayscale copy of the image."""
    return image.convert("L")


def resize_image(image: Image.Image, width: int, height: int) -> Image.Image:
    """Return a resized copy of the image."""
    return image.resize((width, height))


def image_to_array(image: Image.Image) -> np.ndarray:
    """Convert the image into a NumPy array of numeric pixel values.

    Returns an array of shape (height, width) for grayscale images,
    or (height, width, channels) for color images. Each value is an
    integer pixel intensity, typically in the range 0-255.
    """
    return np.array(image)


def save_image(image: Image.Image, path: str) -> None:
    """Save the image to disk at the given path."""
    image.save(path)
  
