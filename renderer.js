import {Field, FieldState, Mine, UnknownFieldState} from "./field.js";

export class Renderer {
    constructor(ctx, gameConfig, fieldPixelSize, fields) {
        this.ctx = ctx;
        this.gameConfig = gameConfig;
        this.fieldPixelSize = fieldPixelSize;
        this.fields = fields;
    }

    render() {
        this.renderFields();
        this.drawGrid();
    }

    renderFields() {
        const singleFieldPixel = this.fieldPixelSize / this.gameConfig.fieldSize;
        const translateFieldPos = f => {
            const leftUpperX = f.colNo * singleFieldPixel;
            const leftUpperY = f.rowNo * singleFieldPixel;
            const rightLowerX = leftUpperX + singleFieldPixel;
            const rightLowerY = leftUpperY + singleFieldPixel;
            return [
                new Position(leftUpperX, leftUpperY),
                new Position(rightLowerX, rightLowerY)
            ];
        }

        for(let row= 0; row < this.fields.length; row++)
        {
            for (let col = 0; col < this.fields[row].length; col++)
            {
                let field = this.fields[row][col];
                const [leftUpper, rightLower] = translateFieldPos(field);
                const fRenderer = new FieldRenderer(c => {
                    this.drawRect(leftUpper, rightLower, c)
                    if(field.getState() === FieldState.Unveiled)
                    {
                        this.drawNumber(leftUpper, rightLower, Renderer.calculateMines(row, col, this.fields))
                    }
                });
                field.renderOnField(fRenderer, new Hitbox(leftUpper, rightLower));
            }
        }
    }

    static calculateMines(row, col, fields) {
        const directions = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 },                        { row: 0, col: 1 },
            { row: 1, col: -1 },  { row: 1, col: 0 },   { row: 1, col: 1 }
        ];

        let mineCount = 0;

        directions.forEach(direction => {
            const newRow = row + direction.row;
            const newCol = col + direction.col;

            if (Renderer.isValidCoordinate(fields, newRow, newCol) && fields[newRow][newCol] instanceof Mine) {
                mineCount++;
            }
        });

        return mineCount;
    }

    static isValidCoordinate(fields, row, col) {
        return row >= 0 && row < fields.length && col >= 0 && col < fields[0].length;
    }


    static validateCoordinate(maxRow, maxCol, row, col)
    {
        return !(row < 0 || row > maxRow || col < 0 || col > maxCol);
    }

    drawNumber(leftUpper, rightLower, number)
    {
        this.ctx.font = "30px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = 'center';
        this.ctx.fillText(number, leftUpper.x + leftUpper.horizontalDistanceTo(rightLower) / 2, leftUpper.y + leftUpper.verticalDistanceTo(rightLower) / 2);
    }

    drawGrid() {
        const drawLineAndShift = (start, end, shiftFunc) => {
            this.drawLine(start, end);
            start = shiftFunc(start);
            end = shiftFunc(end);
            return [start, end];
        }

        const gap = this.fieldPixelSize / this.gameConfig.fieldSize;
        const origin = new Position(0, 0);
        let start = origin;
        let end = start.moveY(this.fieldPixelSize);
        for (let i = 0; i <= this.gameConfig.fieldSize; i++) {
            [start, end] = drawLineAndShift(start, end, (position) => {return position.moveX(gap)});
        }
        start = origin;
        end = start.moveX(this.fieldPixelSize);
        for (let i = 0; i <= this.gameConfig.fieldSize; i++) {
            [start, end] = drawLineAndShift(start, end, (position) => {return position.moveY(gap)});
        }
    }

    drawLine(startPos, endPos) {
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.stroke();
    }

    drawRect(leftUpper, rightLower, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.rect(
            leftUpper.x,
            leftUpper.y,
            leftUpper.horizontalDistanceTo(rightLower),
            leftUpper.verticalDistanceTo(rightLower)
        );
        this.ctx.fill();
    }
}

export class FieldRenderer {
    constructor(draw) {
        this.draw = draw;
    }

    render(state) {
        let color = null;
        switch (state) {
            case FieldState.Hidden:
            {
                color = 'grey';
                break;
            }
            case FieldState.Unveiled:
            {
                color = 'white';
                break;
            }
            case FieldState.Flagged:
            {
                color = 'blue';
                break;
            }
            case FieldState.Detonated:
            {
                color = 'red';
                break;
            }
            default: {
                throw new UnknownFieldState(state);
            }
        }
        this.draw(color);
    }
}

export class Hitbox {
    constructor(leftUpper, rightLower) {
        this.leftUpper = leftUpper;
        this.rightLower = rightLower;
    }

    isHit(hit) {
        return (
            hit.x >= this.leftUpper.x &&
            hit.x <= this.rightLower.x &&
            hit.y >= this.leftUpper.y &&
            hit.y <= this.rightLower.y
        );
    }
}

export class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    moveX(pixel) {
        return new Position(this.x + pixel, this.y);
    }

    moveY(pixel) {
        return new Position(this.x, this.y + pixel);
    }

    horizontalDistanceTo(other) {
        const distance = this.x - other.x;
        return Math.abs(distance);
    }

    verticalDistanceTo(other) {
        const distance = this.y - other.y;
        return Math.abs(distance);
    }
}