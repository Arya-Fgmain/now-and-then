import React from 'react';

// Export the options so other files can import them too
export const imageOptions = [
  { name: '1930s', url: '/tex1.png' },
  { name: '1940s', url: '/tex2.png' },
  { name: '1970s', url: '/tex3.png' },
  { name: '1990s', url: '/tex4.png' },
];

export const quantizationLevelOptions = [
  { name: 'None', number: '0' },
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

function TextureSelector({ texture, setTexture }) {
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
          style={{ width: '300px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
}

export default TextureSelector;

function QuantizationLayerSelector({ quantizationLayerCount, setQuantizationLayerCount }) {
  const handleChange = (e) => {
    setQuantizationLayerCount(e.target.value); // Set the texture selected from the dropdown
  };

  return (
    <div>
      <label>Select an option: </label>
      <div style={{ marginTop: '5px' }}>
        <select onChange={handleChange} value={quantizationLayerCount}>
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