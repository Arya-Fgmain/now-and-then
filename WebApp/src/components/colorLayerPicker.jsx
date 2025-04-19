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
    let isActiveSelectLayer = false;
    let hasInitialized = false;
    const selectLayer = async () => {
        const canvas = document.getElementById('canvas');
        const coordx = document.getElementById('coordx');
        const coordy = document.getElementById('coordy');
        const btn_selectLayer = document.getElementById('btn-select-layer');
        const scale = 0.6

        const loadImageAsMat = (path) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    const mat = cv.imread(img);
                    mat.data
                    resolve(mat);
                };
                img.onerror = (err) => {
                    reject(err);
                };
            });
        };

        if (!canvas) return;

        isActiveSelectLayer = !isActiveSelectLayer;
        if (!isActiveSelectLayer) {
            btn_selectLayer.innerText = 'Select';

            if (hasInitialized) {
                const layers = await Promise.all([
                    loadImageAsMat('/layer_0.png'),
                    loadImageAsMat('/layer_1.png'),
                    loadImageAsMat('/layer_2.png'),
                    loadImageAsMat('/layer_3.png'),
                    loadImageAsMat('/layer_4.png'),
                    loadImageAsMat('/layer_5.png'),
                    loadImageAsMat('/layer_6.png'),
                ]);
                const _x = +coordx.value;
                const _y = +coordy.value;
                console.log(layers[2].ucharPtr(_y, _x));

                let max_alpha = 0;
                let max_index = 0;
                for (let i = 0; i < layers.length; ++i) {
                    const alpha = layers[i].ucharPtr(_y, _x)[3];
                    if (alpha > max_alpha) {
                        max_alpha = alpha;
                        max_index = i;
                    }
                }
                console.log(`idx=${max_index}, alpha=${max_alpha}`)

                for (let i = 0; i < layers.length; ++i) {
                    layers[i].delete();

                }
            }
            return;
        } else {
            btn_selectLayer.innerText = 'Decide';
        }

        if (!hasInitialized) {
            hasInitialized = true;
            canvas.addEventListener('click', function (e) {
                if (!isActiveSelectLayer) return;

                // Get the mouse position
                const rect = canvas.getBoundingClientRect();
                let x = e.clientX - rect.left;
                let y = e.clientY - rect.top;

                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    x = Math.floor(x / scale);
                    y = Math.floor(y / scale);

                    console.log(`Mouse position: (y=${y}, x=${x})`);

                    if (coordx) { coordx.value = `${x}`; }
                    if (coordy) { coordy.value = `${y}`; }
                };
            });
        }
    };

    return (
        <div id="layer-selector">
            <button
                onClick={selectLayer}
                className="default-button" id="btn-select-layer"
                style={{ padding: "10px 20px", marginTop: "20px", width: "30%" }}
            >
                Select
            </button>
            <span class="coord-text"
                style={{ padding: "10px", width: "5%" }}>x:</span>
            <input type="number" id="coordx" placeholder="X" min="0"
                style={{ width: "20%" }} />
            <span class="coord-text"
                style={{ padding: "10px", width: "5%" }}>y:</span>
            <input type="number" id="coordy" placeholder="Y" min="0"
                style={{ width: "20%" }} />
        </div>
    );
}

export default GetLayer;