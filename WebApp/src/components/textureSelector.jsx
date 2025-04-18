import React from 'react';

// Export the options so other files can import them too
export const imageOptions = [
  { name: '1930s', url: '/tex1.png' },
  { name: '1940s', url: '/tex2.png' },
  { name: '1970s', url: '/tex3.png' },
  { name: '1990s', url: '/tex4.png' },
];

function TextureSelector({ texture, setTexture }) {
  const handleChange = (e) => {
    setTexture(e.target.value); // Set the texture selected from the dropdown
  };

  return (
    <div>
      <label>Select a texture: </label>
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
