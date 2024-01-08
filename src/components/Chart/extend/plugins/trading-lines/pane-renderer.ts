import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { BitmapPositionLength } from '../../helpers/dimensions/common';
import { positionsLine } from '../../helpers/dimensions/positions';
import {
  averageWidthPerCharacter,
  buttonHeight,
  buttonWidth,
  centreLabelHeight,
  centreLabelInlinePadding,
  crossPath,
  crossViewBoxSize,
  iconPadding,
  iconSize,
  pnlWidth,
  removeButtonWidth,
} from './constants';
import { LineRendererData } from './irenderer-data';
import { PaneRendererBase } from './renderer-base';

export class PaneRenderer extends PaneRendererBase {
  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      if (!this._data) return;
      this._drawTradingLines(scope);
    });
  }

  _drawTradingLines(scope: BitmapCoordinatesRenderingScope) {
    if (!this._data?.lines) return;
    const color = this._data.color;
    this._data.lines.forEach((line) => {
      this._drawHorizontalLine(scope, {
        width: scope.mediaSize.width,
        lineWidth: 1,
        color,
        y: line.y,
      });
      this._drawTradingLineLabels(scope, line);
    });
  }

  _drawHorizontalLine(
    scope: BitmapCoordinatesRenderingScope,
    data: {
      width: number;
      lineWidth: number;
      color: string;
      y: number;
    },
  ) {
    const ctx = scope.context;
    try {
      const yPos = positionsLine(data.y, scope.verticalPixelRatio, data.lineWidth);
      const yCentre = yPos.position + yPos.length / 2;

      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = data.lineWidth;
      ctx.strokeStyle = data.color;
      const dash = 4 * scope.horizontalPixelRatio;
      ctx.setLineDash([dash, dash]);
      ctx.moveTo(0, yCentre);
      ctx.lineTo(data.width * scope.horizontalPixelRatio, yCentre);
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  _calculateLabelWidth(textLength: number) {
    return centreLabelInlinePadding * 2 + removeButtonWidth + textLength * averageWidthPerCharacter;
  }

  _drawTradingLineLabels(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData) {
    if (!this._data?.lines) return;
    const ctx = scope.context;
    if (!activeLabel || !activeLabel.text) return;

    const labelWidth = this._calculateLabelWidth(activeLabel.text.length);
    const labelXDimensions = positionsLine(scope.mediaSize.width / 2, scope.horizontalPixelRatio, labelWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, centreLabelHeight);
    const scaling = (iconSize / crossViewBoxSize) * scope.horizontalPixelRatio;

    ctx.save();
    try {
      const radius = 4 * scope.horizontalPixelRatio;

      // draw main body background of label
      ctx.beginPath();
      ctx.roundRect(labelXDimensions.position, yDimensions.position, labelXDimensions.length, yDimensions.length, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      const removeButtonStartX = labelXDimensions.position + labelXDimensions.length - removeButtonWidth * scope.horizontalPixelRatio;
      if (activeLabel.hoverRemove) {
        // draw hover background for remove button
        ctx.beginPath();
        ctx.roundRect(removeButtonStartX, yDimensions.position, removeButtonWidth * scope.horizontalPixelRatio, yDimensions.length, [
          0,
          radius,
          radius,
          0,
        ]);
        ctx.fillStyle = '#cccccc';
        ctx.fill();
      }

      // draw button divider
      ctx.beginPath();
      const dividerDimensions = positionsLine(removeButtonStartX / scope.horizontalPixelRatio, scope.horizontalPixelRatio, 1);
      ctx.fillStyle = '#F1F3FB';
      ctx.fillRect(dividerDimensions.position, yDimensions.position, dividerDimensions.length, yDimensions.length);

      // draw stroke for main body
      ctx.beginPath();
      ctx.roundRect(labelXDimensions.position, yDimensions.position, labelXDimensions.length, yDimensions.length, radius);
      ctx.strokeStyle = '#131722';
      ctx.lineWidth = 1 * scope.horizontalPixelRatio;
      ctx.stroke();

      // write text
      ctx.beginPath();
      ctx.fillStyle = '#131722';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(12 * scope.verticalPixelRatio)}px sans-serif`;
      ctx.fillText(
        activeLabel.text,
        labelXDimensions.position + centreLabelInlinePadding * scope.horizontalPixelRatio,
        activeLabel.y * scope.verticalPixelRatio,
      );

      // Draw Send Button
      if (
        activeLabel.line.type === 'ENTRY' &&
        (activeLabel.hoverLabel || activeLabel.hoverTP || activeLabel.hoverSL || activeLabel.hoverBE)
      ) {
        this._drawTPSLButtons(scope, activeLabel, labelWidth);
      } else if (activeLabel.hoverLabel || activeLabel.hoverSplit) {
        this._drawSplitButton(scope, activeLabel, labelWidth);
      }

      // draw button icon
      ctx.beginPath();
      ctx.translate(
        removeButtonStartX + (scope.horizontalPixelRatio * (removeButtonWidth - iconSize)) / 2,
        (activeLabel.y - 5) * scope.verticalPixelRatio,
      );
      ctx.scale(scaling, scaling);
      ctx.fillStyle = '#131722';
      ctx.fill(crossPath, 'evenodd');
      ctx.resetTransform();

      if (activeLabel.line.type !== 'ENTRY') {
        this._drawPnlLabel(scope, activeLabel);
      }
    } finally {
      ctx.restore();
    }
  }

  _drawTPSLButtons(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData, labelWidth: number) {
    const startX = scope.mediaSize.width / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;
    const xBE = positionsLine(startX - buttonWidth - iconPadding - buttonWidth - iconPadding, scope.horizontalPixelRatio, buttonWidth);
    const xTP = positionsLine(startX - buttonWidth - iconPadding, scope.horizontalPixelRatio, buttonWidth);
    const xSL = positionsLine(startX, scope.horizontalPixelRatio, buttonWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    this._drawButton(scope, 'BE', activeLabel.hoverBE ? 'lightgreen' : 'yellow', xBE, yDimensions);
    this._drawButton(scope, 'TP', activeLabel.hoverTP ? 'lightgreen' : 'green', xTP, yDimensions);
    this._drawButton(scope, 'SL', activeLabel.hoverSL ? 'lightred' : 'red', xSL, yDimensions);
  }

  _drawSplitButton(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData, labelWidth: number) {
    const startX = scope.mediaSize.width / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;
    const xSplit = positionsLine(startX, scope.horizontalPixelRatio, buttonWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    this._drawButton(scope, 'Split', activeLabel.hoverSplit ? 'lightgreen' : 'green', xSplit, yDimensions);
  }

  _drawPnlLabel(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData) {
    const ctx = scope.context;

    const xDimensions = positionsLine(scope.mediaSize.width - pnlWidth / 2, scope.horizontalPixelRatio, pnlWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    const radius = 4 * scope.horizontalPixelRatio;

    ctx.beginPath();
    // Save the current canvas state
    ctx.save();
    ctx.roundRect(xDimensions.position, yDimensions.position, xDimensions.length, yDimensions.length, [radius, 0, 0, radius]);
    ctx.strokeStyle = '#131722';
    ctx.fillStyle = activeLabel.line.type === 'TP' ? 'darkgreen' : 'darkred';
    ctx.lineWidth = 1 * scope.horizontalPixelRatio;
    ctx.stroke();
    ctx.fill();

    // Draw button text
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '$' + Math.abs(Number(activeLabel.pnl)),
      xDimensions.position + xDimensions.length / 2,
      yDimensions.position + yDimensions.length / 2,
    );
    ctx.restore();
  }

  _drawButton(
    scope: BitmapCoordinatesRenderingScope,
    text: string,
    bgColor: string,
    xDimensions: BitmapPositionLength,
    yDimensions: BitmapPositionLength,
  ) {
    const ctx = scope.context;
    const radius = 4 * scope.horizontalPixelRatio;
    // Save the current canvas state
    ctx.save();

    ctx.beginPath();
    ctx.roundRect(xDimensions.position, yDimensions.position, xDimensions.length, yDimensions.length, radius);
    ctx.strokeStyle = '#131722';
    ctx.fillStyle = bgColor;
    ctx.lineWidth = 1 * scope.horizontalPixelRatio;
    ctx.stroke();
    ctx.fill();

    // Draw button text
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, xDimensions.position + xDimensions.length / 2, yDimensions.position + yDimensions.length / 2);
    // Restore the saved canvas state
    ctx.restore();
  }
}
