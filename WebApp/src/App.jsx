import { useState, useEffect, useRef } from "react";
import Collapsible from "./components/Collapsible";
import Sliders from "./components/Sliders";
import ColorPicker from "./components/colorPicker";
import ImageUploader from "./components/simpleMultifile";
import TextureSelector, { imageOptions, quantizationLevelOptions, QuantizationLayerSelector } from "./components/textureSelector";
import OpenCVView from "./components/OpenCVView";
import { GetLayer, ApplyMultiDots } from "./components/colorLayerPicker";
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

  /*  const downloadImage = async () => {
     // Redraw rgbCanvas to hi-res version
     await drawImageOnCanvas(URL.createObjectURL(rgbFile), rgbCanvasRef, false);
     // Display loading
     setDisplayLoading(true);
     // Redraw nirCanvas to hi-res version
     await drawImageOnCanvas(URL.createObjectURL(nirFile), nirCanvasRef, false);
     // reference: https://stackoverflow.com/questions/10179815/get-loop-counter-index-using-for-of-syntax-in-javascript
     for (const [index, file] of additionalFiles.entries()) {
       await drawImageOnCanvas(
         URL.createObjectURL(file.file),
         additionalCanvasRefs[index],
         false
       );
     }
     copyCanvasData(rgbCanvasRef, resultCanvasRef);
 
     // apply all edits to hi-res version
     history.slice(0, currentHistoryIndex + 1).forEach((editItem) => {
       applyEdit(editItem);
     });
 
     // Get the canvas
     const canvas = resultCanvasRef.current;
     if (!canvas) return; // Return if no canvas is found
 
     // Create image URL
     const imageUrl = canvas.toDataURL("image/png");
 
     // Create a temporary link to trigger the download
     const downloadLink = document.createElement("a");
     downloadLink.href = imageUrl;
     downloadLink.download = "result-image.png"; // Set the name of the download file
 
     // Append to the document, trigger, and remove the link
     document.body.appendChild(downloadLink);
     downloadLink.click();
     document.body.removeChild(downloadLink);
 
     // go back to downsampled version for further edits
     drawImageOnCanvas(URL.createObjectURL(rgbFile), rgbCanvasRef, true);
     drawImageOnCanvas(URL.createObjectURL(nirFile), nirCanvasRef, true);
     additionalFiles.forEach(async (file, index) => {
       await drawImageOnCanvas(
         URL.createObjectURL(file.file),
         additionalCanvasRefs[index],
         true
       );
     });
     copyCanvasData(previewChangeRef, resultCanvasRef);
     // Hide loading
     setDisplayLoading(false);
   };
  */


  const resetCanvas = () => {
    copyCanvasData(resultCanvasRef, previewChangeRef);
  };

  // setup function to resize result and preview canvas when window is resized
  useEffect(() => {
    const handleResizeCanvas = () => {
      // resize canvas to appropriate size
      const resultCanvas = resultCanvasRef.current;
      const previewCanvas = previewChangeRef.current;

      const resultCtx = resultCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const previewCtx = resultCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      const { height, width } = resultCanvas;

      const resultData = resultCtx.getImageData(0, 0, width, height);
      const previewData = previewCtx.getImageData(0, 0, width, height);

      resultCtx.clearRect(0, 0, width, height);
      previewCtx.clearRect(0, 0, width, height);

      resultCtx.putImageData(resultData, 0, 0);
      previewCtx.putImageData(previewData, 0, 0);

      const aspectRatio = height / width;
      const displayWidth =
        aspectRatio > 1.3 ? window.innerWidth * 0.6 : window.innerWidth * 0.4;
      const displayHeight = displayWidth * aspectRatio;

      resultCanvas.style.width = `${displayWidth}px`;
      resultCanvas.style.height = `${displayHeight}px`;
      previewCanvas.style.width = `${displayWidth}px`;
      previewCanvas.style.height = `${displayHeight}px`;
    };
    const handleWheel = (event) => {
      event.preventDefault();
      const scaleAdjustment = event.deltaY * 0.005;
      setZoomScale((prevScale) => Math.max(prevScale - scaleAdjustment, 0.1));
    };

    window.addEventListener("resize", handleResizeCanvas);
    return () => {
      window.removeEventListener("resize", handleResizeCanvas);
    };
  }, []);

  return (
    <div className="container">
      <div className="main-content">
        {/* <h3>OpenCV Image Mixer</h3> */}
        <div className="canvas-container">
          <div className="result-canvas"><OpenCVView
            imagePaths={[...imagePaths, texture]} 
            dotStrength={dotStrength}
            dotsColor={dotsColor}/>
            
          </div>
          <div className="preview-canvas">
            {/* <canvas id="draft-canvas" style={{ width: "100%" }} ></canvas> */}
            <canvas id="multi-dot-layer-canvas" style={{ width: "100%" }} ></canvas>
          </div>

        </div>

        <div className="control-panel">
          <Collapsible
            title="Upload Files"
            openTool={openTool}
            setOpenTool={setOpenTool}>
            <b>Select your layers</b>
            <ImageUploader
              imagePaths={imagePaths}
              setImagePaths={setImagePaths} />
          </Collapsible>

          {<Collapsible
            title="Texture Options"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >
            {<TextureSelector
              texture={texture}
              setTexture={setTexture}
            />}
          </Collapsible>}

          {<Collapsible
            title="Quantization Layers"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >
            
            {<QuantizationLayerSelector
              quantizationLayerCount={quantizationLayerCount}
              setQuantizationLayerCount={setQuantizationLayerCount}
            />}
          </Collapsible>}
          
          {<Collapsible
            title="Layer Count"
            openTool={openTool}
            setOpenTool={setOpenTool}
          >
            {<TextureSelector
              texture={texture}
              setTexture={setTexture}
            />}
          </Collapsible>}

          {<Collapsible
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
              applyEdit={()=>{}}
            />
            <p id="dot-strength-text">{dotStrength.Settings["Dot Size"]}</p>
          </Collapsible>

          <button
            //onClick={downloadImage}
            className="default-button"
            style={{ padding: "10px 20px", marginTop: "20px" }}
          >
            Download Result Image
          </button>

          <GetLayer paths={[...imagePaths]} />
          <ApplyMultiDots paths={[...imagePaths]} />


        </div>
      </div>
    </div >
  );
};
export default App;
