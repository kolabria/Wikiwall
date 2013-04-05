(function () {

function getFluidGridFunction(selector) {
    return function () {
        reOrganize(selector)
    };
}

function biggestBox(container, aspectRatio) {
    var aspectRatio = aspectRatio || (3 / 4),
        height = (container.width * aspectRatio),
        res = {};

    if (height > container.height) {
        return {
            height: container.height,
            width: container.height / aspectRatio
        };
    } else {
        return {
            width: container.width,
            height: container.width * aspectRatio
        };
    }
}

function reOrganize(selector) {
    var floor = Math.floor,
        elements = $(selector),
        howMany = elements.length,
        availableWidth = window.innerWidth,
        availableHeight = 160,
        container = {
            width: availableWidth,
            height: availableHeight
        },
        columnPadding = 15,
        minimumWidth = 50,
        aspectRatio = 3 / 4,

        numberOfColumns,
        numberOfRows,

        numberOfPaddingColumns,
        numberOfPaddingRows,

        itemDimensions,
        totalWidth,

        videoWidth,
        leftMargin,

        videoHeight,
        usedHeight,
        topMargin;

     console.log('# elements',howMany);

    elements.height(availableHeight);

    // how we want the to stack at different numbers
    if (howMany === 0) {
        return;
    } else if (howMany === 1) {
        numberOfColumns = 1;
        numberOfRows = 1;
    } else if (howMany === 2) {
        if (availableWidth > availableHeight) {
            numberOfColumns = 2;
            numberOfRows = 1;
        } else {
            numberOfColumns = 1;
            numberOfRows = 2;
        }
    } else if (howMany === 3) {
        if (availableWidth > availableHeight) {
            numberOfColumns = 3;
            numberOfRows = 1;
        } else {
            numberOfColumns = 1;
            numberOfRows = 3;
        }
    } else if (howMany === 4) {
        numberOfColumns = 2;
        numberOfRows = 2;
    } else if (howMany === 5) {
        numberOfColumns = 3;
        numberOfRows = 2;
    } else if (howMany === 6) {
        if (availableWidth > availableHeight) {
            numberOfColumns = 3;
            numberOfRows = 2;
        } else {
            numberOfColumns = 2;
            numberOfRows = 3;
        }
    }

    itemDimensions = biggestBox({
        width: availableWidth / numberOfColumns,
        height: availableHeight / numberOfRows
    });

    numberOfPaddingColumns = numberOfColumns - 1;
    numberOfPaddingRows = numberOfRows - 1;

    totalWidth = itemDimensions.width * numberOfColumns;

    videoWidth = function () {
        var totalWidthLessPadding = totalWidth - (columnPadding * numberOfPaddingColumns);
        return totalWidthLessPadding / numberOfColumns;
    }();

    leftMargin = (availableWidth - totalWidth) / 2;

    console.log('leftMargin', leftMargin);

    videoHeight = itemDimensions.height - ((numberOfRows > 1) ? (columnPadding / numberOfRows) : 0);
    usedHeight = (numberOfRows * videoHeight);
    topMargin = (availableHeight - usedHeight) / 2;

    elements.each(function (index) {
        var order = index,
            row = floor(order / numberOfColumns),
            column = order % numberOfColumns,
            intensity = 12,
            rotation = function () {
                if (numberOfColumns === 3) {
                    if (column === 0) {
                        return 1;
                    } else if (column === 1) {
                        return 0;
                    } else if (column === 2) {
                        return -1
                    }
                } else if (numberOfColumns === 2) {
                    intensity = 5;
                    return column == 1 ? -1 : 1
                } else if (numberOfColumns === 1) {
                    return 0;
                }
            }(),
            transformation = 'rotateY(' + (rotation * intensity) + 'deg)';

        if (rotation === 0) {
            transformation += ' scale(.98)';
        }
    console.log("top",(row * itemDimensions.height) + topMargin );
    console.log('left',(column * itemDimensions.width) + leftMargin);
    console.log('width',videoWidth);
    console.log('height',videoHeight);

        $(this).css({
            //transform: transformation,
            top: (row * itemDimensions.height) + topMargin + 'px',
            left: (column * itemDimensions.width) + leftMargin + 'px',
            width: videoWidth + 'px',
            height: videoHeight + 'px'
        });
    });
}

if (typeof exports !== 'undefined') {
    module.exports = getFluidGridFunction;
} else {
    window.getFluidGridFunction = getFluidGridFunction;
}

})();
