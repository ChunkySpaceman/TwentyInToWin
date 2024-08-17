$(document).ready(function () {
    let defaultSlots = parseInt($('#holeCount').val());
    let maxNumber = parseInt($('#maxNumber').val());
    let currentNumber = null;
    let targetSlot = null;
    let slots = new Array(defaultSlots).fill(null); // Initialize an array to track slot values

    // Function to initialize slots
    function initializeSlots() {
        $('#slotsContainer').empty();
        slots = new Array(defaultSlots).fill(null); // Reset slots array
        for (let i = 0; i < defaultSlots; i++) {
            let j = i + 1;
            $('#slotsContainer').append('<div class="slot btn btn-outline-secondary rounded-pill mb-1" data-order="' + i + '">slot ' + j + '</div>');
        }
        makeSlotsDroppable(); // Apply droppable after initializing slots
    }

    // Function to make slots droppable
    function makeSlotsDroppable() {
        $('.slot').droppable({
            accept: '#generatedNumber',
            over: function (event, ui) {
                if ($(this).hasClass('btn-outline-success')) { // Slot is highlighted as acceptable
                    $(this).addClass('btn-success');
                }
                if ($(this).hasClass('btn-outline-danger')) { // Slot is highlighted as unacceptable
                    $(this).addClass('btn-danger');
                }
            },
            out: function (event, ui) {
                $(this).removeClass('btn-success btn-danger');
            },
            drop: function (event, ui) {
                if ($(this).hasClass('btn-outline-success')) { // Slot is highlighted as acceptable
                    const slotOrder = $(this).data('order');
                    slots[slotOrder] = currentNumber; // Update the array with the locked-in number

                    $('#lockInBtn').data('target', this).removeClass('d-none');
                    targetSlot = this; // Store the slot reference for locking in

                    // Move the generatedNumber to the slot's position and keep the width
                    $(ui.helper).css({
                        top: $(this).position().top,
                        left: $(this).position().left,
                        width: $(this).width(), // Keep the width consistent
                        position: 'absolute'
                    }).appendTo(this); // Attach the number to the slot
                }
            }
        });
    }

    // Function to handle game over (lose)
    function gameOver(message, borderColor) {
        setTimeout(() => {
            $('body').css('border', `20px solid ${borderColor}`);
            alert(message);
        }, 500); // Wait 1 second before showing the alert
    }

    // Function to handle winning the game
    function gameWon() {
        gameOver('Congratulations! You filled all the slots. You win!', 'green');
    }

    // Function to handle losing the game
    function gameLost() {
        gameOver('No valid slots. Game over man, game over.', 'red');
    }

    // Initialize slots on page load
    initializeSlots();

    // Handle generate button click
    $('#generateBtn').on('click', function () {
        // Generate a number that isn't already in a slot
        do {
            currentNumber = Math.floor(Math.random() * maxNumber) + 1;
        } while (slots.includes(currentNumber)); // Continue generating until we find a unique number

        // Remove any existing #generatedNumber
        $('#generatedNumber').remove();

        // Reset all slots to their original class
        $('.slot').removeClass('btn-outline-success btn-outline-danger').addClass('btn-outline-secondary');

        // Create #generatedNumber element dynamically
        const generatedNumberDiv = $('<div>', {
            id: 'generatedNumber',
            class: 'mt-2 draggable-number ui-widget-content btn btn-info rounded-pill',
            text: currentNumber
        }).css({
            width: $('#buttonList').width() // Ensure it keeps the initial width
        }).appendTo('#buttonList');

        // Make it draggable
        generatedNumberDiv.draggable({
            revert: false, // Do not revert position
            stop: function (event, ui) {
                if (!targetSlot) {
                    $(this).css({ top: 0, left: 0 }); // Reset position if not dropped in a slot
                }
            }
        });

        $(this).prop('disabled', true);

        // Highlight acceptable and unacceptable slots
        highlightSlots(currentNumber);
    });

    // Handle reset button click
    $('#resetBtn').on('click', function () {
        resetGame(); // Call the reset game function
    });

    // Function to find the closest values above and below the generated number
    function findClosestValues(number) {
        let closestBelow = 0;
        let closestBelowIndex = -1;  // Initialize with -1 to indicate no valid slot found
        let closestAbove = 1001;
        let closestAboveIndex = slots.length;  // Initialize with max index to indicate no valid slot found

        slots.forEach((value, index) => {
            if (value !== null) {
                if (value < number && value > closestBelow) {
                    closestBelow = value;
                    closestBelowIndex = index;
                }
                if (value > number && value < closestAbove) {
                    closestAbove = value;
                    closestAboveIndex = index;
                }
            }
        });

        return { closestBelow, closestAbove, closestBelowIndex, closestAboveIndex };
    }

    // Highlight acceptable and unacceptable slots based on the closest values
    function highlightSlots(number) {
        const { closestBelow, closestAbove, closestBelowIndex, closestAboveIndex } = findClosestValues(number);

        // Check if no valid slots are available
        if (closestAboveIndex - closestBelowIndex <= 1) {
            gameLost();
            return;
        } else {
            $('body').css('border', 'none'); // Reset the border if slots are available
        }

        for (let i = 0; i < slots.length; i++) {
            //console.log(`Checking Slot ${i}: Current value is ${slots[i]}`);
            
            if (slots[i] === null) {
                //console.log(`Slot ${i} is empty and being evaluated.`);
                // The slot is valid if it falls between the closestBelowIndex and closestAboveIndex
                if (i > closestBelowIndex && i < closestAboveIndex) {
                    $(`.slot[data-order=${i}]`).removeClass('btn-outline-secondary btn-outline-danger').addClass('btn-outline-success');
                } else {
                    $(`.slot[data-order=${i}]`).removeClass('btn-outline-secondary btn-outline-success').addClass('btn-outline-danger');
                }
            } else {
                //console.log(`Slot ${i} is filled with ${slots[i]} and will not be modified.`);
                //$(`.slot[data-order=${i}]`).removeClass('btn-outline-secondary').addClass('btn-outline-info').addClass('text-dark');
            }
        }
    }

    // Handle lock in button click
    $('#lockInBtn').on('click', function () {
        if (targetSlot) {
            const slotOrder = $(targetSlot).data('order');

            // Update the slot with the locked-in number
            $(targetSlot)
                .text(currentNumber) // Update the slot text with the locked-in number
                .addClass('locked btn-info') // Add the btn-info and locked classes
                .removeClass('btn-outline-secondary') // Remove the outline-secondary class
                .removeClass('btn-outline-success btn-outline-danger'); // Remove success and danger classes

            // Remove #generatedNumber element from the DOM
            $('#generatedNumber').remove();

            // Reset all other slots to btn-outline-secondary if they are still empty
            $('.slot').each(function () {
                if (slots[$(this).data('order')] === null) {
                    $(this).removeClass('btn-outline-success btn-outline-danger btn-success btn-danger').addClass('btn-outline-secondary');
                }
            });

            // Check for win condition
            if (slots.every(slot => slot !== null)) {
                gameWon();
            } else {
                $('#generateBtn').prop('disabled', false);
                $(this).addClass('d-none');
                targetSlot = null; // Reset the target slot after locking in
            }
        }
    });

    // Update slots and maxNumber when inputs are changed
    $('#holeCount').on('change', function () {
        defaultSlots = parseInt($(this).val());
        initializeSlots();
        resetGame();
    });

    $('#maxNumber').on('change', function () {
        maxNumber = parseInt($(this).val());
        resetGame();
    });

    // Function to reset the game without resetting inputs
    function resetGame() {
      slots = new Array(defaultSlots).fill(null); // Reset slots array
      $('#slotsContainer').empty();
      initializeSlots();
      $('#generateBtn').prop('disabled', false);
      $('#lockInBtn').addClass('d-none');
      $('#generatedNumber').remove(); // Remove the generated number element
      $('body').css('border', 'none'); // Reset border color
    }
});
