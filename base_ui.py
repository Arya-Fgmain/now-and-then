from tkinter import *
from tkinter.ttk import * 
from tkinter import filedialog
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
B_getPath = Button(base, text= "Choose image", command=lambda: get_file(L_fileName))
Im_image = PhotoImage()
L_image = Label(base, image=Im_image)
S_scale = Scale(base, from_=0, to= 255)
B_flipLeft = Button(base, text="<--", command=shift_left)
B_flipRight = Button(base, text="-->", command=shift_right)


#SB_vertical_image = Scrollbar(  base, orient='vertical')
#SB_vertical_image.config(command=L_image.)

#organizes the GUI items and places them in the interface
L_image.grid(row=0,column=0, columnspan=3)
#S_scale.grid(row=1,column=0, columnspan=2) not currently used

B_flipLeft.grid(row = 2, column=0, sticky="W")
B_flipRight.grid(row=2, column=2, sticky="E")


L_fileName.grid(row = 3, column = 0)
B_getPath.grid(row = 2, column = 1, sticky="N")

mainloop()
