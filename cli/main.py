"""
Main entry point for the Image Information and Processing Tool.

Run this script and follow the on-screen menu to:
  1. Load an image
  2. Display it
  3. Find its dimensions
  4. Convert it to grayscale
  5. Resize it
  6. Convert it to a numeric (NumPy) array
  7. Save the processed image
"""

import numpy as np
from image_tool import (
    load_image,
    display_image,
    get_dimensions,
    convert_to_grayscale,
    resize_image,
    image_to_array,
    save_image,
)


def main():
    print("=== Image Information & Processing Tool ===\n")

    path = input("Enter path to the image file: ").strip()
    try:
        image = load_image(path)
    except FileNotFoundError as e:
        print(e)
        return

    print(f"Loaded: {path}\n")

    while True:
        print("\nChoose an option:")
        print("1. Display image")
        print("2. Show image dimensions")
        print("3. Convert to grayscale")
        print("4. Resize image")
        print("5. Convert to numeric array")
        print("6. Save current image")
        print("7. Exit")

        choice = input("Enter choice (1-7): ").strip()

        if choice == "1":
            display_image(image)

        elif choice == "2":
            width, height = get_dimensions(image)
            print(f"Dimensions: {width} x {height} pixels")
            print(f"Mode: {image.mode}")

        elif choice == "3":
            image = convert_to_grayscale(image)
            print("Image converted to grayscale.")

        elif choice == "4":
            try:
                width = int(input("Enter new width: "))
                height = int(input("Enter new height: "))
                image = resize_image(image, width, height)
                print(f"Image resized to {width}x{height}.")
            except ValueError:
                print("Please enter valid whole numbers.")

        elif choice == "5":
            array = image_to_array(image)
            print(f"Array shape: {array.shape}")
            print(f"Data type: {array.dtype}")
            print(f"Top-left 3x3 sample:\n{array[:3, :3]}")

            save_choice = input("Save the full array to a file? (y/n): ").strip().lower()
            if save_choice == "y":
                out_path = input("Enter output filename (.npy or .csv): ").strip()
                if out_path.endswith(".npy"):
                    np.save(out_path, array)
                    print(f"Saved to {out_path}")
                elif out_path.endswith(".csv"):
                    if array.ndim == 2:
                        np.savetxt(out_path, array, fmt="%d", delimiter=",")
                        print(f"Saved to {out_path}")
                    else:
                        print("CSV only supports grayscale (2D) arrays. Use .npy for color images.")
                else:
                    print("Please use a .npy or .csv filename.")

        elif choice == "6":
            out_path = input("Enter output filename (e.g. output.jpg): ").strip()
            save_image(image, out_path)
            print(f"Saved to {out_path}")

        elif choice == "7":
            print("Goodbye!")
            break

        else:
            print("Invalid choice, try again.")


if __name__ == "__main__":
    main()
  
