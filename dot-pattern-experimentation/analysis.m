clear;clc;

im = im2double(imread('drac_input/drac_old.png'));
im_new = im2double(imread('drac_input/drac_new.png'));


%testing area%%%%%%%%%%%%%%
gray_im = rgb2gray(im_new);
%filtered_im = imbilatfilt(gray_im, 0.2, 5);
%figure;
%imshow(imbilatfilt(gray_im,0.2, 5))
% figure;
% imshow(gray_im)
% figure;

% Find dark regions (text, shadows)
threshold = 0.3; % Adjust based on your image
dark_mask = gray_im < threshold;
figure;
imshow(dark_mask);

%%%%%%%%%%%%%







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

new_alpha_black = alphas_new{1};


%% find the strongest alpha layer (highest intensity)

num_pixels = prod(size(im,1,2));

avg_alphas = {}; %  {[0.3804]}    {[0.1901]}    {[0.1186]}    {[0.1641]}    {[0.1464]}

for i=1:num_layers
    curr_alpha = alphas{i}; curr_alpha = curr_alpha(:);
    avg_alphas{i} = sum(curr_alpha)/num_pixels;
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

avg_highfreqs = [0 0 0 0 0];

for i=1:num_layers
    curr_hf = high_freqs{i}; curr_hf = curr_hf(:);
    avg_highfreqs(i) = sum(curr_hf);
end

avg_highfreqs = avg_highfreqs/num_pixels; % 0.0562    0.0243    0.0148    0.0236    0.0164 (perfect correspondence with avg intensity ito order)

%% crop the relevant portion

% row-col coordinates of the cape, which has some dot patterns
top = 500; left = 695;
bottom = top+50; right = left+50;

% modify = alphas{1};
% modify(top:bottom,left:right) = 0;
% alphas{1} = modify;
% 
% modify = alphas{2};
% modify(top:bottom,left:right) = 0;
% alphas{2} = modify;
% 
% modify = alphas{3};
% modify(top:bottom,left:right) = 0;
% alphas{3} = modify;
% 
% modify = alphas{4};
% modify(top:bottom,left:right) = 0;
% alphas{4} = modify;
% 
% modify = alphas{5};
% modify(top:bottom,left:right) = 0;
% alphas{5} = modify;


avhs_normed = avg_highfreqs / sum(avg_highfreqs);

avhs_normed(1) = 0; avhs_normed(2) = 0;

% alpha-add test

output = zeros(size(im));

random_ordering = randperm(num_layers); % dictates how the alpha layers will be swapped

% random_alphas = {};
% 
% for i = 1:num_layers
%     random_alphas{i} = alphas{random_ordering(i)};
% end

% for i=1:num_layers
%     curr_layer = layers{i};
%     curr_alpha = alphas{i};
% 
%     curr_alpha = imfilter(curr_alpha, gauskern); % keep only the low-frequency information
%     curr_alpha = curr_alpha + 1 * high_freqs{i};
% 
%     % alpha_mask = alphas{i} & alphas{i};
%     % uniform_alphas = alpha_mask .* avhs_normed(i);
% 
%     % curr_alpha(top:bottom,left:right) = curr_alpha(top:bottom,left:right)*30;
%     output = output + curr_layer .* curr_alpha;
%     % output = output + curr_layer .* (curr_alpha * avhs_normed(i));
%     % output = output + curr_layer .* uniform_alphas;
%     % output = output + curr_layer .* high_freqs{i};
% end
% 
% imshow(output);


output_new = zeros(size(im_new));

% merging high-frequency alpha info of older layers with high-frequency
% info of new laters
for i = 1:num_layers
    curr_layer = layers_new{i};
    curr_alpha = alphas_new{i};

    % curr_alpha = imfilter(curr_alpha, gauskern); % keep only the low-frequency information

    % resize high_freqs{i} to match curr_alpha size
    hf_resized = imresize(high_freqs{i}, size(curr_alpha));

    % Add the resized high frequency component
    curr_alpha = curr_alpha + 2.5 * hf_resized;

    % curr_alpha = curr_alpha + 1 * high_freqs{i};

    output_new = output_new + curr_layer .* curr_alpha;

end

output_new = output_new + layers_new{6} .* alphas_new{6};
output_new = output_new + layers_new{7} .* alphas_new{7};

%test code
new_alpha_black = new_alpha_black > 0.3;
imshow(new_alpha_black)
alpha_filtered = output_new;
for c = 1:3
    channel = alpha_filtered(:,:,c);
    channel(new_alpha_black) = 0;
    alpha_filtered(:,:,c) = channel;
end

raw_filtered = output_new;
for c = 1:3
    channel = raw_filtered(:,:,c);
    channel(dark_mask) = 0;
    raw_filtered(:,:,c) = channel;
end

subplot(1,3,1); imshow(output_new); title('normal processed Image');
subplot(1,3,2); imshow(alpha_filtered); title('filtered out with 1st layer alpha threshold');
subplot(1,3,3); imshow(raw_filtered); title('filtered out darkness based on raw image greyscale threshold');



%new_alpha_black = new_alpha_black > 0.1;
%imshow(new_alpha_black)

%disp(new_alpha_black)

% waitforbuttonpress
%close all;