import cv2
import numpy as np

# Load images
img1 = cv2.imread("Azusa.png")
img2 = cv2.imread("papertexture.jpg")

# Ensure both images have the same size
img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

# Blend images with weights (alpha=0.6, beta=0.4)

#will have to try with different base textures and different alpha betas
blended = cv2.addWeighted(img1, 0.8, img2, 0.2, 0)

# Show and save the result
cv2.imshow("Blended Image", blended)
cv2.imshow("base image", img1)
#cv2.imwrite("blended_output.jpg", blended)
cv2.waitKey(0)
cv2.destroyAllWindows()
