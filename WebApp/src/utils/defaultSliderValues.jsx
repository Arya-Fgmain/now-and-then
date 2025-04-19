export const defaultFalseColoring = {
  red: { NiR: 0, Red: 100, Green: 0, Blue: 0 },
  green: { NiR: 0, Red: 0, Green: 100, Blue: 0 },
  blue: { NiR: 0, Red: 0, Green: 0, Blue: 100 },
};

export const defaultHSVColoring = {
  values: { NiR: 0, V: 100 },
};

export const defaultLABColoring = {
  values: { NiR: 0, L: 100 },
};

export const defaultFilter = {
  Settings: {
    Strength: 3
  },
};

export const defaultDotStength = {
  settings: {
    "Dot Strength": 1,
    "Dot Oppacity": 1,

  }
}

export const defaultXYZColoring = {
  background: { Red: 41.2453, Green: 35.758, Blue: 18.0423 },
  dot: { Red: 21.2671, Green: 71.516, Blue: 7.2169 },
};

export const defualtBackgroundColor = '#000000'
export const defualtDotsColor = '#ffffff'

export const defaultSliders = {
  linearCombination: defaultFalseColoring,

  HSVColoring: defaultHSVColoring,

  LABColoring: defaultLABColoring,

  Filtering: defaultFilter,

  XYZColoring: defaultXYZColoring,
  
  DotStrength: defaultDotStength,
};
