import { useState, useEffect, useRef } from "react";
import Collapsible from "./components/Collapsible";
import Sliders from "./components/Sliders";
import ColorPicker from "./components/colorPicker";
import ImageUploader from "./components/simpleMultifile";
import TextureSelector, { imageOptions, quantizationLevelOptions, QuantizationLayerSelector } from "./components/textureSelector";
import OpenCVView from "./components/OpenCVView";
import { GetLayer, ApplyMultiDots, ApplyOnWholePage } from "./components/colorLayerPicker";
import {
  defaultDotStrength,
  defaultXYZColoring,
} from "./utils/defaultSliderValues";
import "./App.css";


const App = () => {
  // arrays to track additional files and canvasRefs
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalFilesSliders, setAdditionalFilesSliders] = useState({
    linearCombination: {},
    XYZColoring: {},
    HSVColoring: {},
    LABColoring: {},
  });
  // track openTool to only expand one collapsible element
  const [openTool, setOpenTool] = useState("");

  // Initial values for sliders(traditional xyz transform matrix)
  const [XYZSliders, setXYZSliders] = useState(defaultXYZColoring);

  const [dotStrength, setDotStrength] = useState(defaultDotStrength)


  //background color = backgroundColor
  // color of dots = dotsColor
  // URLs corresponding to the image in the form of a string = imagePaths
  // strength of dots in range 1 to 10 default 5 = dotStrength. access by dotStrength.Settings["Dot Size"]
  //


  //Initial value for background
  //const [dotsColor, setDotsColor] = useState(defualtDotsColor)
  const [dotsColor, setDotsColor] = useState('#000000')

  //for image paths
  const [imagePaths, setImagePaths] = useState(["/layer_0.png", "/layer_1.png", "/layer_2.png", "/layer_3.png", "/layer_4.png", "/layer_5.png", "/layer_6.png"]);

  //for textureSelector
  const [texture, setTexture] = useState(imageOptions[0].url);

  const [quantizationLayerCount, setQuantizationLayerCount] = useState(quantizationLevelOptions[0].number);

  const [zoomScale, setZoomScale] = useState(1);

  // pointers to the canvases
  const resultCanvasRef = useRef(null);
  const previewChangeRef = useRef(null);

  const resetAdditionalSliders = () => {
    setAdditionalFilesSliders((prevValues) => {
      let newSliders = {
        linearCombination: {},
        XYZColoring: {},
        HSVColoring: {},
        LABColoring: {},
      };
      additionalFiles
        .map((file) => file.type)
        .forEach((type) => {
          newSliders.linearCombination = {
            ...newSliders.linearCombination,
            [type]: { red: 0, green: 0, blue: 0 },
          };
          newSliders.XYZColoring = {
            ...newSliders.XYZColoring,
            [type]: { X: 0, Y: 0, Z: 0 },
          };
          newSliders.HSVColoring = {
            ...newSliders.HSVColoring,
            [type]: { values: 0 },
          };
          newSliders.LABColoring = {
            ...newSliders.LABColoring,
            [type]: { values: 0 },
          };
        });

      return newSliders;
    });
  };



  return (
    <div className="container">
      <div className="main-content">
        {/* <h3>OpenCV Image Mixer</h3> */}
        <div className="canvas-container">
          <div>
            <OpenCVView
              imagePaths={[...imagePaths, texture]}
              dotStrength={dotStrength}
              dotsColor={dotsColor}
            />

          </div>
          <div className="preview-canvas">
            {/* <canvas id="draft-canvas" style={{ width: "100%" }} ></canvas> */}
            <canvas id="multi-dot-layer-canvas" style={{ width: "100%" }} ></canvas>
          </div>

        </div>

        <div className="control-panel">
          <Collapsible
            setSliderValues={() => { }}
            title="Upload Files"
            openTool={openTool}
            setOpenTool={setOpenTool}>
            <b>Select your layers</b>
            <ImageUploader
              imagePaths={imagePaths}
              setImagePaths={setImagePaths} />
          </Collapsible>
          <hr/>
          {<Collapsible
            setSliderValues={() => { }}
            title="Texture Options"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >
            {<TextureSelector
              texture={texture}
              setTexture={setTexture}
              paths={imagePaths}
            />}
          </Collapsible>}

          {<Collapsible
            setSliderValues={() => { }}
            title="Dot Color"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >
            <ColorPicker
              color={dotsColor}
              setColor={setDotsColor}
              id="dot"
            />

          </Collapsible>}


          <Collapsible
            title="Dot Settings"
            openTool={openTool}
            setOpenTool={setOpenTool}
            setSliderValues={setDotStrength}
            type="DotStrength"
            resetAdditionalSliders={resetAdditionalSliders}
          >
            <Sliders
              type="DotStrength"
              sliderValues={dotStrength}
              setSliderValues={setDotStrength}
              additionalFiles={additionalFiles}
              additionalFilesSliders={additionalFilesSliders}
              setAdditionalFilesSliders={setAdditionalFilesSliders}
              resetAdditionalSliders={resetAdditionalSliders}
              applyEdit={() => { }}
            />
            <p id="dot-strength-text">{dotStrength.Settings["Dot Size"]}</p>
          </Collapsible>

          {<Collapsible
            setSliderValues={() => { }}
            title="Quantization Levels"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >

            {<QuantizationLayerSelector
              quantizationLayerCount={quantizationLayerCount}
              setQuantizationLayerCount={setQuantizationLayerCount}
            />}
          </Collapsible>}

          <ApplyOnWholePage paths={[...imagePaths]} />
          <GetLayer paths={[...imagePaths]} />
          <ApplyMultiDots paths={[...imagePaths]} />
          
          <hr/>
          <button
            //onClick={downloadImage}
            className="default-button"
            style={{ padding: "10px 20px"}}
          >
            Download Result Image
          </button>
        </div>
      </div>
    </div >
  );
};
export default App;
