import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { PaneRendererBase } from './renderer-base';
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
  removeButtonWidth,
  sendButtonHeight,
  sendButtonWidth,
} from './constants';
import { positionsLine } from '../../helpers/dimensions/positions';
import { BitmapPositionLength } from '../../helpers/dimensions/common';

export class PaneRenderer extends PaneRendererBase {
  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      if (!this._data) return;
      this._drawTradingLines(scope);
      this._drawTradingLineLabels(scope);
    });
  }

  _drawTradingLines(scope: BitmapCoordinatesRenderingScope) {
    if (!this._data?.lines) return;
    const color = this._data.color;
    this._data.lines.forEach((data) => {
      this._drawHorizontalLine(scope, {
        width: scope.mediaSize.width,
        lineWidth: 1,
        color,
        y: data.y,
      });
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

  _drawTradingLineLabels(scope: BitmapCoordinatesRenderingScope) {
    if (!this._data?.lines) return;
    const ctx = scope.context;
    this._data.lines.forEach((activeLabel) => {
      if (!activeLabel || !activeLabel.text) return;

      const labelWidth = this._calculateLabelWidth(activeLabel.text.length);
      const labelXDimensions = positionsLine(scope.mediaSize.width / 2, scope.horizontalPixelRatio, labelWidth);
      const sendXDimensions = positionsLine(
        scope.mediaSize.width - sendButtonWidth / 2 - iconPadding,
        scope.horizontalPixelRatio,
        sendButtonWidth,
      );
      const sendYDimensions = positionsLine(activeLabel.y, scope.verticalPixelRatio, sendButtonHeight);

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
          ctx.fillStyle = '#F0F3FA';
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

        // Draw Send Button
        if (activeLabel.showSend) {
          this._drawSendButton(scope, sendXDimensions, sendYDimensions, activeLabel.hoverSend);
        }
      } finally {
        ctx.restore();
      }
    });
  }

  _drawSendButton(
    scope: BitmapCoordinatesRenderingScope,
    xDimensions: BitmapPositionLength,
    yDimensions: BitmapPositionLength,
    isHover: boolean,
  ) {
    const ctx = scope.context;

    const radius = 4 * scope.horizontalPixelRatio;

    ctx.roundRect(xDimensions.position, yDimensions.position, xDimensions.length, yDimensions.length, radius);
    ctx.strokeStyle = '#131722';
    ctx.fillStyle = isHover ? '#F0F3FA' : 'darkgreen';
    ctx.lineWidth = 1 * scope.horizontalPixelRatio;
    ctx.stroke();
    ctx.fill();

    // Draw button text
    ctx.fillStyle = isHover ? 'black' : 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Send', xDimensions.position + xDimensions.length / 2, yDimensions.position + yDimensions.length / 2);
  }

  _drawLabel(
    scope: BitmapCoordinatesRenderingScope,
    data: {
      width: number;
      labelHeight: number;
      y: number;
      roundedCorners: number | number[];
      icon: Path2D[];
      color: string;
      padding: {
        top: number;
        left: number;
      };
      iconScaling: number;
    },
  ) {
    const ctx = scope.context;
    try {
      ctx.save();
      ctx.beginPath();
      const yDimension = positionsLine(data.y, scope.verticalPixelRatio, data.labelHeight);
      const x = (data.width - (buttonWidth + 1)) * scope.horizontalPixelRatio;
      ctx.roundRect(
        x,
        yDimension.position,
        buttonWidth * scope.horizontalPixelRatio,
        yDimension.length,
        adjustRadius(data.roundedCorners, scope.horizontalPixelRatio),
      );
      ctx.fillStyle = data.color;
      ctx.fill();
      ctx.beginPath();
      ctx.translate(x + data.padding.left * scope.horizontalPixelRatio, yDimension.position + data.padding.top * scope.verticalPixelRatio);
      ctx.scale(data.iconScaling * scope.horizontalPixelRatio, data.iconScaling * scope.verticalPixelRatio);
      ctx.fillStyle = '#FFFFFF';
      data.icon.forEach((path) => {
        ctx.beginPath();
        ctx.fill(path, 'evenodd');
      });
    } finally {
      ctx.restore();
    }
  }
}

function adjustRadius<T extends number | number[]>(radius: T, pixelRatio: number): T {
  if (typeof radius === 'number') {
    return (radius * pixelRatio) as T;
  }
  return radius.map((i) => i * pixelRatio) as T;
}
