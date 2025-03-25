from tkinter import *
from tkinter.ttk import *
from tkinter import filedialog
# will need the PIL.ImageTk module to supprot more file types, like .jpg


# opens a file dialogue, then sets the App's Image as the given file.
def get_file(label):
    filepath = filedialog.askopenfilename(
        title="select an image to be altered", filetypes=[("PNG files", "*.png")])
    label.config(text=filepath)
    Im_image.config(file=filepath)
    # upadtes the scale to have as many values as there are pixels in the width
    S_scale.config(to=Im_image.width)
    print(filepath)


# creates the main window to be used
base = Tk()

# creates the UI objects
L_fileName = Label(base, text="")
B_getPath = Button(base, text="Choose image",
                   command=lambda: get_file(L_fileName))
Im_image = PhotoImage()
L_image = Label(base, image=Im_image)
S_scale = Scale(base, from_=0, to=255)

# organizes the GUI items and places them in the interface
L_image.grid(row=0, column=0, columnspan=2)
S_scale.grid(row=1, column=0, columnspan=2)
L_fileName.grid(row=2, column=0)
B_getPath.grid(row=2, column=1)

mainloop()
