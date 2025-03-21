import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import cv2 as cv

NUM_LAYERS_OLD = 12
NUM_LAYERS_NEW = 15

def get_layers(path, num_layers):
    layers = []

    for i in range(num_layers):
        layers.append(Image.open(f'{path}/output_layers/FinalLayers_{i:02d}.png'))

    layers = np.array(layers) / 255  # note: divide by 255 as we want 0-1 range

    return layers


def extract_color(layer):
    alpha_mask = layer[:,:,3]
    color_indices = np.argwhere(alpha_mask > 0)

    # pick the first colored pixel (they all have the same color) or just the first one (TODO: might be problematic)
    x, y = color_indices[0] if color_indices.size > 0 else [0,0]

    return layer[x,y,:3]
    
def autowb_whiteworld(palette):
    # find the white color in this palette
    w_index = np.argmax(
            np.sum(palette,1) # color with maximum RGB sum has the largest components
        )
    rgb_max = palette[w_index]

    rmax, gmax, bmax = rgb_max

    '''
    # [1/rmax, 0, 0],
    # [0, 1/gmax, 0],
    # [0, 0, 1/bmax]
    '''

    # based on our ISP slides in class
    awb_mat = np.array([
        [gmax/rmax, 0, 0],
        [0, 1, 0],
        [0, 0, gmax/bmax]
        
    ])

    # perform awb transformation on the whole old palette 
    return np.clip( 
        np.array([np.dot(awb_mat, color) for color in old_colors]), 
        0, 1)   # clip to valid range for display purposes
    

def plot_palette(palette, name):
    # Plot the color palette
    fig, ax = plt.subplots(figsize=(12, 2))
    ax.set_xticks([])
    ax.set_yticks([])

    # Create the color bars
    for i, color in enumerate(palette):
        ax.add_patch(plt.Rectangle((i, 0), 1, 1, color=np.array(color)))

    ax.set_xlim(0, NUM_LAYERS_OLD)
    ax.set_ylim(0, 1)

    # save figure
    plt.savefig(name)
    
    # reset matplotlib plot 
    plt.close()
    plt.clf()


def find_matching_old_color(curr_layer, old_layers):
    curr_size = curr_layer.shape[:2]

    curr_layer_color_mask = (curr_layer[:,:,3] > 0)

    mask_intersections = []
    mask_unions = []

    num_old_layers = old_layers.shape[0] # based on shape (n, height, width, channels)

    # compare IOUs with all old layers
    for i in range(num_old_layers):
        layer = old_layers[i]

        # resize to match new layer size in case they don't match
        layer = cv.resize(layer, [curr_size[1], curr_size[0]], interpolation=cv.INTER_CUBIC)
            # note: swap the curr_size elements as opencv works in width-height format, not height-width

        # binary mask of where the pixels are colored in this layer
        layer_color_mask = (layer[:,:,3] > 0)

        # compute both intersections and unions of binary masks
        mask_intersections.append(
            np.logical_and( layer_color_mask, curr_layer_color_mask )
        )
        mask_unions.append( 
            np.logical_or( layer_color_mask, curr_layer_color_mask )
        )

    mask_intersections = np.array([np.sum(m_i) for m_i in mask_intersections])
    mask_unions = np.array([np.sum(m_u) for m_u in mask_unions])

    # get mask IOUs
    mask_ious = mask_intersections/mask_unions

    return np.argmax(mask_ious)

old_layers = get_layers('comic3_results', NUM_LAYERS_OLD)
new_layers = get_layers('comic4_results', NUM_LAYERS_NEW)

old_colors = np.array([extract_color(layer) for layer in old_layers])
new_colors = np.array([extract_color(layer) for layer in new_layers])


''' first: tonemapping on the old comic colors '''

# perform white-balancing based on the white-world assumption
old_colors_awb = autowb_whiteworld(old_colors)
plot_palette(old_colors_awb, 'old_colors.png')


''' method 1: mask IOUs '''

# for each segmented color layer in the new comic, find the old layer whose mask has the most overlap with it

# TODO: removing white layer as it has high IOU with many other layers, make this automatic
old_layers_minus_bw = np.delete(old_layers, 1, axis=0)

match_indices = np.array([find_matching_old_color(layer, old_layers_minus_bw) for layer in new_layers])
match_colors = np.array([old_colors_awb[ind] for ind in match_indices])

# TODO adding white & black colors manually for now, make this automatic
match_colors[0] = [1,1,1]
match_colors[1] = [0,0,0]

new_layers_recolored = []

for i in range(NUM_LAYERS_NEW):
    curr_layer = new_layers[i]
    curr_layer[:,:,:3] = match_colors[i]
    new_layers_recolored.append(
        curr_layer
    )

new_layers_recolored = np.array(new_layers_recolored)

for i, im in enumerate(new_layers_recolored):
    im = np.clip(   # multiply by 255 and clip values to valid range for display
        (im * 255).astype(np.uint8), 0, 255)
    curr_im = Image.fromarray(im, mode='RGBA')
    curr_im.save(f'output/recolored_layer_{i:02d}.png')

# fill this in
output = np.zeros_like(new_layers[0][:,:,:3])

# finally, put the image back together using alpha-add
for i, layer in enumerate(new_layers_recolored):
    curr_r = layer[:,:,0]
    curr_g = layer[:,:,1]
    curr_b = layer[:,:,2]
    curr_alph = layer[:,:,3]
    
    output[:,:,0] += curr_r * curr_alph
    output[:,:,1] += curr_g * curr_alph
    output[:,:,2] += curr_b * curr_alph

plt.imshow(output)
plt.savefig('sample.png')

