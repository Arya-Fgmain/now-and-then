import cv2
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk
import numpy as np

FILE_PATHS = []

# Load the image
image_path = ".\sampleImages\slimefoot.jpg"  # Default image path
paper_texture = cv2.imread(".\sampleImages\pap.png") # Default paper texture
paper_texture = cv2.cvtColor(paper_texture, cv2.COLOR_BGR2RGB) 

original_image = cv2.imread(image_path)
original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB
current_image = original_image.copy()  # To store modified image

# Create the main window
root = tk.Tk()
root.title("Comic Ager")

# Create a Frame to contain the Canvas and Scrollbars
main_frame = tk.Frame(root)
main_frame.grid(row=0, column=0, sticky="nsew")

# Create a Canvas for the image
canvas = tk.Canvas(main_frame)
canvas.grid(row=0, column=0, sticky="nsew")

# Create Scrollbars
h_scrollbar = tk.Scrollbar(main_frame, orient="horizontal", command=canvas.xview)
v_scrollbar = tk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
canvas.configure(xscrollcommand=h_scrollbar.set, yscrollcommand=v_scrollbar.set)

h_scrollbar.grid(row=1, column=0, sticky="ew")
v_scrollbar.grid(row=0, column=1, sticky="ns")

# Create a frame inside the Canvas
image_frame = tk.Frame(canvas)
canvas.create_window((0, 0), window=image_frame, anchor="nw")

# Label to hold the image
label = tk.Label(image_frame)
label.grid(row=0, column=0)

# Convert OpenCV image to Tkinter format
def update_image(_=None):
    #Update the displayed image based on zoom and brightness slider values.
    zoom_factor = zoom_slider.get()
    blending_factor = blending_slider.get()


    #perfrom your opencv adjustments to the image here, using orignal_image as the base
    #if you need help with adding something to the pipeline, feel free to ask and I will work it in or explain how

    # Resize the image based on zoom
    width = int(original_image.shape[1] * zoom_factor)
    height = int(original_image.shape[0] * zoom_factor)
    resized = cv2.resize(original_image, (width, height))

    # Adjust brightness
    #brightened = np.clip(resized * brightness_factor, 0, 255).astype(np.uint8)
    
    # Blend paper texture
    resized_paper = cv2.resize(paper_texture, (resized.shape[1], resized.shape[0]))
    blended = cv2.addWeighted(resized, 1 - blending_factor, resized_paper, blending_factor, 0)
    
    # Convert to Tkinter format
    pil_image = Image.fromarray(blended)
    tk_image = ImageTk.PhotoImage(pil_image)

    # Update label
    label.config(image=tk_image)
    label.image = tk_image  # Keep reference

    # Update scrolling region
    image_frame.update_idletasks()
    canvas.config(scrollregion=canvas.bbox("all"))

# Create get file button
getPath_button = tk.Button(root, text= "Choose image", command=lambda: get_file())
getPath_button.grid(row=1, column=1, sticky="ns", rowspan=2)

def get_file():
    global FILE_PATHS
    
    FILE_PATHS = filedialog.askopenfilenames(title="select an image to be altered", filetypes=[("PNG/JPEG files", "*.png *.jpg")])
    # Open an opencv file
    global original_image 
    global current_image
    original_image = cv2.imread(FILE_PATHS[0])
    current_image = original_image.copy()
    update_image()

# Create Zoom Slider
zoom_slider = tk.Scale(root, from_=0.5, to=2.0, resolution=0.1, orient="horizontal", label="Zoom", command=update_image)
zoom_slider.set(1.0)  # Default value
zoom_slider.grid(row=1, column=0, sticky="ew")

# Create blending Slider
blending_slider = tk.Scale(root, from_=0.0, to=1.0, resolution=0.1, orient="horizontal", label="Texture Strength", command=update_image)
blending_slider.set(0.0)  # Default value
blending_slider.grid(row=2, column=0, sticky="ew")

# Make the window layout expandable
root.grid_rowconfigure(0, weight=1)
root.grid_columnconfigure(0, weight=1)
main_frame.grid_rowconfigure(0, weight=1)
main_frame.grid_columnconfigure(0, weight=1)

# Initial image display
update_image()

# Run the Tkinter loop
root.mainloop()
