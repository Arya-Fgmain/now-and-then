clear;clc;

%% further experiments on dot pattern recovery and coloring, based on Yagiz's formulations

clear;clc;

im = im2double(imread('drac_input/drac_old.png'));
im_new = im2double(imread('drac_input/drac_new.png'));


% alpha-add test
num_layers = 5;

layers = {};
alphas = {};

for i=1:num_layers
    [curr_im, ~, curr_alpha] = imread(sprintf('drac_old_layers/FinalLayers_%02d.png', i-1));
    curr_im = im2double(curr_im); curr_alpha = im2double(curr_alpha);
    % output = output + curr_im .* curr_alpha;
    layers{i} = curr_im;
    alphas{i} = curr_alpha;
end

% also read the new layers and alphas
num_layers_new = 7;

layers_new = {};
alphas_new = {};

for i=1:num_layers_new
    [curr_im, ~, curr_alpha] = imread(sprintf('drac_new_layers/FinalLayers_%02d.png', i-1));
    curr_im = im2double(curr_im); curr_alpha = im2double(curr_alpha);
    % output = output + curr_im .* curr_alpha;
    layers_new{i} = curr_im;
    alphas_new{i} = curr_alpha;
end

%% analyze alpha layer gradients

gauskern = fspecial('gaussian', 15, 2); % maybe try with a larger std

high_freqs = {};

for i=1:num_layers
    curr_alpha = alphas{i};
    % high_freqs{i} = abs(curr_alpha - imfilter(curr_alpha, gauskern));
    high_freqs{i} = curr_alpha - imfilter(curr_alpha, gauskern);
end

% imshow([high_freqs{1} high_freqs{2} high_freqs{3} high_freqs{4} high_freqs{5}])

%% merging

output_new = zeros(size(im_new));

new_hf = im2double(imread('sample_texture.png'));

% dilate dot pattern using a circular kernel of radius 1, can use this
% instead
se = strel('disk', 1);  % 'r' is the radius
dil = imdilate(new_hf, se);
% imshow([dil*5 new_hf]);

% resize the chosen alpha map to the size of the image's alpha maps
% hf_resized = imresize(high_freqs{4}, size(alphas_new{1}));
hf_resized = imresize(dil, size(alphas_new{1}));

hf_resized(hf_resized < 0) = 0;

% info of new laters
for i = 1:num_layers_new
    curr_layer = layers_new{i};
    curr_alpha = alphas_new{i};    

    % manipulate the high-frequency dot map for merging
    
    % algo bad 1 (not modulating normalized alphas by the current alpha)
    % gamma_2 = hf_resized;

    % algo bad 2 (colors are weak)
    % gamma_2 = hf_resized;
    % gamma_2 = min(gamma_2, curr_alpha);

    % algo bad 3 (not modulating normalized alphas by the current alpha)
    % hf_norm = hf_resized / max(hf_resized(:));
    % gamma_2 = hf_norm;
    
    % algo1
    % hf_norm = hf_resized / max(hf_resized(:));
    % gamma_2 = min(hf_norm .* curr_alpha, curr_alpha);

    % algo2
    hf_norm = hf_resized / max(hf_resized(:));
    gamma_2 = hf_norm .* curr_alpha;

    

    gamma_1 = curr_alpha-gamma_2; 

    curr_layer_a = curr_layer;

    curr_layer_b = ones(size(curr_layer_a));
    % curr_layer_b(:,:,1) = 1; curr_layer_b(:,:,2) = 0; curr_layer_b(:,:,3) = 0;
    curr_layer_b(:,:,1) = 0.5; curr_layer_b(:,:,2) = 0.5; curr_layer_b(:,:,3) = 0.5;
    % curr_layer_b(:,:,1) = 0.0039; curr_layer_b(:,:,2) = 0.1216; curr_layer_b(:,:,3) = 0.2941;
    % curr_layer_b(:,:,1) = 0.3922; curr_layer_b(:,:,2) = 0.0510; curr_layer_b(:,:,3) = 0.3725;

    output_new = output_new + (gamma_1.*curr_layer_a + gamma_2.*curr_layer_b);

end

% output_new = output_new + layers_new{1} .* alphas_new{1};
% output_new = output_new + layers_new{2} .* alphas_new{2};
% output_new = output_new + layers_new{3} .* alphas_new{3};
% output_new = output_new + layers_new{5} .* alphas_new{5};
% output_new = output_new + layers_new{6} .* alphas_new{6};
% output_new = output_new + layers_new{7} .* alphas_new{7};

imshow([output_new im_new])
