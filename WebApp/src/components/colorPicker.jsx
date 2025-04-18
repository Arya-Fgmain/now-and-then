import React from 'react';
import { SketchPicker } from 'react-color';

function ColorPicker({ color, setColor }) {
  const handleChange = (newColor) => {
    setColor(newColor.hex);
  };

  return (
    <div style={{ padding: '20px' }}>
      <SketchPicker color={color} onChange={handleChange} />
      <p style={{ marginTop: '10px' }}>Selected color: <strong>{color}</strong></p>
      <div style={{
        marginTop: '10px',
        width: '100px',
        height: '100px',
        backgroundColor: color,
        border: '1px solid #000'
      }} />
    </div>
  );
}

export default ColorPicker;