export const pnlWidth = 50;
export const buttonWidth = 21;
export const buttonHeight = 21;
export const showButtonDistance = 50;
export const labelHeight = 17;
export const borderRadius = 2;
export const iconPadding = 4;
export const iconSize = 9;

export const showCentreLabelDistance = 50;
export const averageWidthPerCharacter = 6; // doesn't need to be exact, just roughly correct. 12px sans-serif
export const removeButtonWidth = 26;
export const centreLabelHeight = 20;
export const centreLabelInlinePadding = 12;

export const crossViewBoxSize = 10;
export const crossPath = new Path2D(
  'M9.35359 1.35359C9.11789 1.11789 8.88219 0.882187 8.64648 0.646484L5.00004 4.29293L1.35359 0.646484C1.11791 0.882212 0.882212 1.11791 0.646484 1.35359L4.29293 5.00004L0.646484 8.64648C0.882336 8.88204 1.11804 9.11774 1.35359 9.35359L5.00004 5.70714L8.64648 9.35359C8.88217 9.11788 9.11788 8.88217 9.35359 8.64649L5.70714 5.00004L9.35359 1.35359Z',
);

export const arrowViewBoxSize = 448; // This value should match the viewBox size in the SVG

// <!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) -->
export const arrowUp = new Path2D(
  'M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z',
);
export const arrowDown = new Path2D(
  'M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z',
);

export const profitIcon = new Path2D(
  'M352 288h-16v-88c0-4.42-3.58-8-8-8h-13.58c-4.74 0-9.37 1.4-13.31 4.03l-15.33 10.22a7.994 7.994 0 0 0-2.22 11.09l8.88 13.31a7.994 7.994 0 0 0 11.09 2.22l.47-.31V288h-16c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8h64c4.42 0 8-3.58 8-8v-16c0-4.42-3.58-8-8-8zM608 64H32C14.33 64 0 78.33 0 96v320c0 17.67 14.33 32 32 32h576c17.67 0 32-14.33 32-32V96c0-17.67-14.33-32-32-32zM48 400v-64c35.35 0 64 28.65 64 64H48zm0-224v-64h64c0 35.35-28.65 64-64 64zm272 192c-53.02 0-96-50.15-96-112 0-61.86 42.98-112 96-112s96 50.14 96 112c0 61.87-43 112-96 112zm272 32h-64c0-35.35 28.65-64 64-64v64zm0-224c-35.35 0-64-28.65-64-64h64v64z',
);
