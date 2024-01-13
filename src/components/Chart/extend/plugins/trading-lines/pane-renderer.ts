import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { BitmapPositionLength } from '../../helpers/dimensions/common';
import { positionsLine } from '../../helpers/dimensions/positions';
import {
  arrowDown,
  arrowUp,
  arrowViewBoxSize,
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
  profitIcon,
  removeButtonWidth,
  statusIcon,
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

    this._data.lines.forEach((label) => {
      const lineColor = label.line.type === 'TP' ? 'darkgreen' : label.line.type === 'SL' ? 'red' : color;
      this._drawHorizontalLine(scope, {
        width: scope.mediaSize.width,
        lineWidth: 1,
        color: label.line.isPreview ? 'blue' : lineColor,
        y: label.y,
      });
      this._drawTradingLineLabels(scope, label);
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
      ctx.lineWidth = data.lineWidth * scope.verticalPixelRatio;
      ctx.strokeStyle = data.color;
      const dash = 3 * scope.horizontalPixelRatio;
      ctx.setLineDash([dash, dash]);
      ctx.moveTo(0, yCentre);
      ctx.lineTo(data.width * scope.horizontalPixelRatio, yCentre);
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  _calculateLabelWidth(textLength: number) {
    return centreLabelInlinePadding * 2 + 3 * removeButtonWidth + textLength * averageWidthPerCharacter;
  }

  _drawTradingLineLabels(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData) {
    if (!this._data?.lines) return;
    const ctx = scope.context;
    if (!activeLabel || !activeLabel.text) return;

    const labelWidth = this._calculateLabelWidth(activeLabel.text.length);
    const labelXDimensions = positionsLine(scope.mediaSize.width / 2, scope.horizontalPixelRatio, labelWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, centreLabelHeight);
    const scaling = (iconSize / crossViewBoxSize) * scope.horizontalPixelRatio;
    const scalingArrow = (iconSize / arrowViewBoxSize) * scope.horizontalPixelRatio;

    ctx.save();
    try {
      const radius = 4 * scope.horizontalPixelRatio;

      // draw main body background of label
      ctx.beginPath();
      ctx.roundRect(labelXDimensions.position, yDimensions.position, labelXDimensions.length, yDimensions.length, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // draw Direction Button
      const startArrowIcon = labelXDimensions.position + removeButtonWidth / 2;
      ctx.beginPath();
      ctx.translate(startArrowIcon, (activeLabel.y - 6) * scope.verticalPixelRatio);
      ctx.scale(scalingArrow, scalingArrow);
      if (activeLabel.line.type === 'ENTRY') {
        ctx.fillStyle = activeLabel.line.side === 'Buy' ? 'green' : 'red';
        ctx.fill(activeLabel.line.side === 'Buy' ? arrowUp : arrowDown, 'evenodd');
      } else {
        ctx.fillStyle = activeLabel.line.type === 'TP' ? 'green' : 'red';
        ctx.fill(profitIcon, 'evenodd');
      }
      ctx.resetTransform();

      // draw button divider
      const endArrowIcon = labelXDimensions.position + removeButtonWidth * scope.horizontalPixelRatio;
      ctx.beginPath();
      const directionDividerDimensions = positionsLine(endArrowIcon / scope.horizontalPixelRatio, scope.horizontalPixelRatio, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(directionDividerDimensions.position, yDimensions.position, directionDividerDimensions.length, yDimensions.length);
      ctx.resetTransform();

      // draw Status Indicator
      const startStatusIcon = directionDividerDimensions.position + directionDividerDimensions.length + iconPadding;
      ctx.beginPath();
      ctx.translate(startStatusIcon, (activeLabel.y - 6) * scope.verticalPixelRatio);
      ctx.scale(scalingArrow, scalingArrow);
      ctx.fillStyle = activeLabel.line.isLive ? 'green' : activeLabel.line.isServer ? 'yellow' : 'gray';
      ctx.fill(statusIcon, 'evenodd');
      ctx.resetTransform();

      // draw button divider
      const statusIconEndX = startStatusIcon + (removeButtonWidth / 2) * scope.horizontalPixelRatio;
      ctx.beginPath();
      const statusIconDividerDimensions = positionsLine(statusIconEndX / scope.horizontalPixelRatio, scope.horizontalPixelRatio, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(statusIconDividerDimensions.position, yDimensions.position, statusIconDividerDimensions.length, yDimensions.length);

      // write text
      ctx.beginPath();
      ctx.fillStyle = '#131722';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(12 * scope.verticalPixelRatio)}px sans-serif`;
      ctx.fillText(
        activeLabel.text,
        labelXDimensions.position + 2 * removeButtonWidth + centreLabelInlinePadding + labelWidth / 2,
        activeLabel.y * scope.verticalPixelRatio,
      );

      // draw button divider
      const removeButtonStartX = labelXDimensions.position + labelXDimensions.length - removeButtonWidth * scope.horizontalPixelRatio;
      ctx.beginPath();
      const dividerDimensions = positionsLine(removeButtonStartX / scope.horizontalPixelRatio, scope.horizontalPixelRatio, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(dividerDimensions.position, yDimensions.position, dividerDimensions.length, yDimensions.length);

      if (activeLabel.hoverRemove) {
        // draw hover background for remove button
        ctx.beginPath();
        ctx.roundRect(removeButtonStartX, yDimensions.position, removeButtonWidth * scope.horizontalPixelRatio, yDimensions.length, [
          0,
          radius,
          radius,
          0,
        ]);
        ctx.fillStyle = 'red';
        ctx.fill();
      }

      // draw button icon
      ctx.beginPath();
      ctx.translate(
        removeButtonStartX + (scope.horizontalPixelRatio * (removeButtonWidth - iconSize)) / 2,
        (activeLabel.y - 5) * scope.verticalPixelRatio,
      );
      ctx.scale(scaling, scaling);
      ctx.fillStyle = activeLabel.hoverRemove ? 'white' : '#131722';
      ctx.fill(crossPath, 'evenodd');
      ctx.resetTransform();

      // Draw Send Button
      if (
        activeLabel.line.type === 'ENTRY' &&
        (activeLabel.hoverLabel || activeLabel.hoverTP || activeLabel.hoverSL || activeLabel.hoverBE)
      ) {
        this._drawEntryButtons(scope, activeLabel, labelWidth);
      } else if (activeLabel.hoverLabel || activeLabel.hoverSplit) {
        this._drawSplitButton(scope, activeLabel, labelWidth);
      }

      if (activeLabel.line.type === 'ENTRY' && !activeLabel.line.isServer) {
        this._drawSendButton(scope, activeLabel);
      }

      this._drawPnlLabel(scope, activeLabel);

      // draw stroke for main body - At the end to write on top of all other edges
      ctx.beginPath();
      ctx.roundRect(labelXDimensions.position, yDimensions.position, labelXDimensions.length, yDimensions.length, radius);
      ctx.strokeStyle = '#131722';
      ctx.lineWidth = 1 * scope.horizontalPixelRatio;
      ctx.stroke();
    } finally {
      ctx.restore();
    }
  }

  _drawSendButton(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData) {
    const text = 'Send';
    const labelWidth = centreLabelInlinePadding * 2 + text.length * averageWidthPerCharacter;

    const startSendButton = scope.mediaSize.width - labelWidth / 2;
    const xDimensions = positionsLine(startSendButton, scope.horizontalPixelRatio, labelWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);
    const ctx = scope.context;
    const radius = 4 * scope.horizontalPixelRatio;
    // Save the current canvas state
    ctx.save();

    ctx.beginPath();
    ctx.roundRect(xDimensions.position, yDimensions.position, xDimensions.length, yDimensions.length, [radius, 0, 0, radius]);
    ctx.strokeStyle = '#131722';
    ctx.fillStyle = activeLabel.hoverSend ? 'white' : 'lightblue';
    ctx.lineWidth = 1 * scope.horizontalPixelRatio;
    ctx.stroke();
    ctx.fill();

    // Draw button text
    ctx.fillStyle = 'black';
    ctx.font = `${Math.round(10 * scope.verticalPixelRatio)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, xDimensions.position + xDimensions.length / 2, yDimensions.position + yDimensions.length / 2);
    // Restore the saved canvas state
    ctx.restore();
  }

  _drawEntryButtons(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData, labelWidth: number) {
    const startX = scope.mediaSize.width / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    if (activeLabel.canTP) {
      const tpColor = activeLabel.hoverTP ? 'white' : 'green';
      const xTP = positionsLine(startX - buttonWidth - iconPadding - buttonWidth - iconPadding, scope.horizontalPixelRatio, buttonWidth);
      this._drawButton(scope, 'TP', tpColor, xTP, yDimensions);
    }

    if (activeLabel.canSL) {
      const slColor = activeLabel.hoverSL ? 'white' : 'red';
      const xSL = positionsLine(startX - buttonWidth - iconPadding, scope.horizontalPixelRatio, buttonWidth);
      this._drawButton(scope, 'SL', slColor, xSL, yDimensions);
    }

    const xBE = positionsLine(startX, scope.horizontalPixelRatio, buttonWidth);
    this._drawButton(scope, 'BE', activeLabel.hoverBE ? 'white' : 'yellow', xBE, yDimensions);
  }

  _drawSplitButton(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData, labelWidth: number) {
    const startX = scope.mediaSize.width / 2 - labelWidth / 2 - buttonWidth / 2 - iconPadding;
    const xSplit = positionsLine(startX, scope.horizontalPixelRatio, buttonWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    this._drawButton(scope, 'S', activeLabel.hoverSplit ? 'white' : 'green', xSplit, yDimensions);
  }

  _drawPnlLabel(scope: BitmapCoordinatesRenderingScope, activeLabel: LineRendererData) {
    const ctx = scope.context;

    const xDimensions = positionsLine(scope.mediaSize.width - pnlWidth / 2, scope.horizontalPixelRatio, pnlWidth);
    const yDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, buttonHeight);

    const radius = 4 * scope.horizontalPixelRatio;

    const positivePnl = activeLabel.positivePnl;
    const isEntry = activeLabel.line.type === 'ENTRY';

    if (isEntry && !activeLabel.line.isLive) return;

    ctx.beginPath();
    // Save the current canvas state
    ctx.save();
    ctx.roundRect(xDimensions.position, yDimensions.position, xDimensions.length, yDimensions.length, [radius, 0, 0, radius]);
    ctx.strokeStyle = '#131722';
    ctx.fillStyle = isEntry ? 'white' : positivePnl ? 'green' : 'red';
    ctx.lineWidth = 1 * scope.horizontalPixelRatio;
    ctx.stroke();
    ctx.fill();

    // Draw button text
    ctx.fillStyle = isEntry ? (positivePnl ? 'green' : 'red') : 'white';
    ctx.font = `${Math.round(10 * scope.verticalPixelRatio)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeLabel.pnl, xDimensions.position + xDimensions.length / 2, yDimensions.position + yDimensions.length / 2);
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
    ctx.font = `${Math.round(10 * scope.verticalPixelRatio)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, xDimensions.position + xDimensions.length / 2, yDimensions.position + yDimensions.length / 2);
    // Restore the saved canvas state
    ctx.restore();
  }
}
