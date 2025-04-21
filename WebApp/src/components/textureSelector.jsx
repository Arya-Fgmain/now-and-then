import React from 'react';

// Export the options so other files can import them too
export const imageOptions = [
  { name: '1930s', url: '/sample_30s.png' },
  { name: '1940s', url: '/sample_40s.png' },
  { name: '1970s', url: '/sample_70s.png' },
  { name: '1990s (1)', url: '/sample_90s.png' },
  { name: '1990s (2)', url: '/sample_lobo.png' },
  { name: '1990s (3)', url: '/sample_ds1.png' },
  { name: '1990s (4)', url: '/sample_ds2.png' },
  { name: '1990s (5)', url: '/sample_ds3.png' },
  { name: 'pure dots 1', url: '/sample_fixpat1.png' },
  { name: 'pure dots 2', url: '/sample_fixpat2.png' },
  { name: 'high dpi', url: '/sample_highdpi.png' },
  { name: 'low dpi', url: '/sample_lowdpi.png' },

  { name: 'gouache', url: '/sample_kingdom.png' },

  { name: '1930s', url: '/tex-4000-30s.png' },
  { name: '1940s', url: '/tex-4000-40s.png' },
  { name: '1970s', url: '/tex-4000-70s.png' },
  { name: '1990s', url: '/tex-4000-90s.png' },
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
          id="texture-preview"
          style={{ width: '300px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
}

export default TextureSelector;
