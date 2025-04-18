/**
 * @fileoverview This file contains functions to handle color layer selection
 * based on the coordinates where the mouse is pointed. It provides utilities
 * to interact with and manipulate color layers dynamically.
 * 
 * @author Xiangxiang Wang
 * @date 2025-04-17
 */

function GetLayer({ paths }) {
    // same as OpenCVView.loadImageAsMat
    const loadImageAsMat = (path) => {
        return new Promise(() => {
            const img = new Image();
            img.src = path;
            mat = cv.imread(img);
        });
    };
    img0 = loadImageAsMat(paths[0]);
}