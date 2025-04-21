import React from 'react';
import { useRef, useEffect } from 'react';

// default names for texture names as well as the urls in public folder they represent
export const imageOptions = [
  // { name: '1930s', url: '/sample_30s.png' },
  // { name: '1940s', url: '/sample_40s.png' },
  // { name: '1970s', url: '/sample_70s.png' },
  // { name: '1990s (1)', url: '/sample_90s.png' },
  // { name: '1990s (2)', url: '/sample_lobo.png' },
  // { name: '1990s (3)', url: '/sample_ds1.png' },
  // { name: '1990s (4)', url: '/sample_ds2.png' },
  // { name: '1990s (5)', url: '/sample_ds3.png' },
  // { name: 'pure dots 1', url: '/sample_fixpat1.png' },
  // { name: 'pure dots 2', url: '/sample_fixpat2.png' },
  // { name: 'high dpi', url: '/sample_highdpi.png' },
  // { name: 'low dpi', url: '/sample_lowdpi.png' },

  // { name: 'gouache', url: '/sample_kingdom.png' },

  { name: '1930s', url: '/tex-4000-30s.png' },
  { name: '1940s', url: '/tex-4000-40s.png' },
  { name: '1970s', url: '/tex-4000-70s.png' },
  { name: '1990s', url: '/tex-4000-90s.png' },
];


//default values for the quantization levels
export const quantizationLevelOptions = [
  // { name: 'None', number: '0' },
  { name: '2', number: '2' },
  { name: '3', number: '3' },
  { name: '4', number: '4' },
  { name: '5', number: '5' },
  { name: '6', number: '6' },
  { name: '7', number: '7' },
  { name: '8', number: '8' },
  { name: '9', number: '9' },
  { name: '10', number: '10' },
]

function TextureSelector({ texture, setTexture, paths }) {

  const handleChange = (e) => {
    setTexture(e.target.value); // Set the texture selected from the dropdown
  };

  return (
    <div>
      <label>Select an option: </label>
      <select onChange={handleChange} value={texture}>
        {imageOptions.map((img, index) => (
          <option key={index} value={img.url}>
            {img.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: '20px' }}>
        <img
          src={texture}
          alt="Selected"
          id="texture-preview"
          style={{ width: '300px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
}

export default TextureSelector;


//creates an input for the number of quantization levels.
function QuantizationLayerSelector({ quantizationLayerCount, setQuantizationLayerCount }) {
  useEffect(() => {
    setQuantizationLayerCount("5"); // or any logic
  }, []);

  const handleChange = (e) => {
    setQuantizationLayerCount(e.target.value); // Set the texture selected from the dropdown
  };

  return (
    <div>
      <label>Select an option: </label>
      <div style={{ marginTop: '5px' }}>
        <select id="dot-strength-select-text" onChange={handleChange} value={quantizationLayerCount}>
          {quantizationLevelOptions.map((img, index) => (
            <option key={index} value={img.url}>
              {img.name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}

export { QuantizationLayerSelector };