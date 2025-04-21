import React, { useState } from 'react';

function ImageUploader({ imagePaths, setImagePaths }) {

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const paths = files.map(file => URL.createObjectURL(file));
    setImagePaths(paths);
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={handleFileChange} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>

        {imagePaths.map((img, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <img src={img} alt={`Image ${i}`} style={{ width: '150px', height: 'auto' }} />
            <p>{img.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;
