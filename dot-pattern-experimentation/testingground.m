%testingground
clear;clc;

im = im2double(imread('drac_input/drac_old.png'));
im_new = im2double(imread('drac_input/drac_new.png'));

im = im_new;

imshow(im)

%testing area%%%%%%%%%%%%%%
gray_im = rgb2gray(im);
filtered_im = imbilatfilt(gray_im, 0.3, 3);
imshow(filtered_im)
figure;
%imshow(imbilatfilt(gray_im,0.5, 7))
%figure;
imshow(gray_im)

black_mask = gray_im < 0.15;
imshow(gray_im < 0.15)
waitforbuttonpress


% Find dark regions (text, shadows)
threshold = 0.2; % Adjust based on your image
dark_mask = filtered_im < threshold; % Binary mask for dark areas

dark_regions = gray_im .* dark_mask;

background_only = gray_im .* ~dark_mask;

figure;
imshow(dark_mask);

dark_overlay = cat(3, dark_regions, dark_regions, dark_regions);
background_overlay = cat(3, background_only, background_only, background_only);

figure;
subplot(1,3,1); imshow(gray_im); title('Original Image');
subplot(1,3,2); imshow(dark_overlay); title('Extracted Dark Regions');
subplot(1,3,3); imshow(background_overlay); title('Background Only');

waitforbuttonpress;
close all;
%%%%%%%%%%%%%


