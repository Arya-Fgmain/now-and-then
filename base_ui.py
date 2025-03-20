from tkinter import *
from tkinter.ttk import * 
from tkinter import filedialog
from PIL import Image, ImageTk
import cv2
import numpy as np
#requires installing the pillow library to run
# can be installed with : pip install pillow    
#will need the PIL.ImageTk module to supprot more file types, like .jpg


FILE_PATHS = []
CURRENT_FILE = 0

#opens a file dialogue, then sets the App's Image as the given file. 
def get_file(label):
    global FILE_PATHS
    
    FILE_PATHS = filedialog.askopenfilenames(title="select an image to be altered", filetypes=[("PNG files", "*.png")])
    #label.config(text=FILE_PATHS)
    #open an opencv file
    
    
    image = cv2.imread(FILE_PATHS[0])
    #perform any operations that we want on the image here
    
    #convert it into rgb
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    #convert to PIl image
    pil_image = Image.fromarray(image)
    #open with tkinter
    tk_image = ImageTk.PhotoImage(pil_image)
    #display in label
    label.config(image = tk_image)
    label.image = tk_image  # Keep a reference
    
    
    
    
    
    Im_image.config(file=FILE_PATHS[0])
    
    
    
    
    #upadtes the scale to have as many values as there are pixels in the width
    S_scale.config(to=Im_image.width)
    print(FILE_PATHS)

    base.geometry(f"{Im_image.width+50}x{Im_image.height+60}")
    
    
def shift_left():
    global CURRENT_FILE
    print(CURRENT_FILE)
    if CURRENT_FILE == 0:
        CURRENT_FILE = len(FILE_PATHS)-1
        Im_image.config(file=FILE_PATHS[len(FILE_PATHS)-1])
        
    else:
        CURRENT_FILE -= 1
        Im_image.config(file=FILE_PATHS[CURRENT_FILE])
    
def shift_right():
    global CURRENT_FILE
    print(CURRENT_FILE)
    if len(FILE_PATHS) == CURRENT_FILE+1:
        CURRENT_FILE = 0
        Im_image.config(file=FILE_PATHS[0])
    else:
        CURRENT_FILE += 1
        Im_image.config(file=FILE_PATHS[CURRENT_FILE])
        
        
        
        


#creates the main window to be used
base = Tk()

#base.geometry("500x300")
base.config()


#creates the UI objects
L_fileName = Label(base, text = "")
B_getPath = Button(base, text= "Choose image", command=lambda: get_file(L_image))
Im_image = PhotoImage()
L_image = Label(base, image=Im_image)
S_scale = Scale(base, from_=0, to= 255)
B_flipLeft = Button(base, text="<--", command=shift_left)
B_flipRight = Button(base, text="-->", command=shift_right)



 #create canvas
canvas = Canvas(base)
h_scrollbar = Scrollbar(base, orient="horizontal", command=canvas.xview)
v_scrollbar = Scrollbar(base, orient="vertical", command=canvas.yview)

canvas.configure(xscrollcommand=h_scrollbar.set, yscrollcommand=v_scrollbar.set)


# Create a frame inside the canvas to hold the image
frame = Frame(canvas)
canvas.create_window((0, 0), window=frame, anchor="nw")

L_image = Label(frame)

# Update the scroll region based on image size
def update_scroll_region():
    canvas.update_idletasks()
    canvas.config(scrollregion=canvas.bbox("all"))
    
update_scroll_region()    

h_scrollbar.pack(side="bottom", fill="x")
v_scrollbar.pack(side="right", fill="y")




#SB_vertical_image = Scrollbar(  base, orient='vertical')
#SB_vertical_image.config(command=L_image.)

#organizes the GUI items and places them in the interface
#L_image.grid(row=0,column=0, columnspan=3)
#L_fileName.grid(row=0,column=0, columnspan=3)
canvas.grid(row=0,column=0, columnspan=3)
#S_scale.grid(row=1,column=0, columnspan=2) not currently used

B_flipLeft.grid(row = 2, column=0, sticky="W")
B_flipRight.grid(row=2, column=2, sticky="E")


L_fileName.grid(row = 3, column = 0)
B_getPath.grid(row = 2, column = 1, sticky="N")

mainloop()
