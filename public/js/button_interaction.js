// Handles all interactions with reaction buttons
// - Hover highlight
// - Button press
// - Reaction screen text

'user strict'

// Functions

// Highlights the button of specified type if entered is true
// Unhighlights it if entered is false
var highlightControl = function(button, type, entered)
{
    var colour = '#ffffff';

    switch(type) 
    {
        case 'envy':
            
            if (entered === true)
            {
                colour = '#71f76f';
            }
            else
            {
                colour = '#c4f9c3';
            }

            break;

        case 'happy':
           
            if (entered === true)
            {
                colour = '#d8ec44';
            }
            else
            {
                colour = '#f4fea4';
            }

            break;

        case 'angry':
            
            if (entered === true)
            {
                colour = '#fb6f6f';
            }
            else
            {
                colour = '#f9c3c3';
            }

            break;

        case 'sad':
            
            if (entered === true)
            {
                colour = '#5f78f7';
            }
            else
            {
                colour = '#c3ccf9';
            }

            break;
    }

    // Updating button colour
    button.setAttribute('material', {
        color: colour   
    });
}

// Updates the reaction text of specified type on screen
// Highlights it when selected is true
// Unhighlights it when selected is false
var updateScreen = function(type, selected)
{
    var colour = '#ffffff';

    switch(type) 
    {
        case 'envy':
            
            if (selected === true)
            {
                colour = '#71f76f';
            }
            else
            {
                colour = '#707070';
            }

            break;

        case 'happy':
           
            if (selected === true)
            {
                colour = '#d8ec44';
            }
            else
            {
                colour = '#707070';
            }

            break;

        case 'angry':
            
            if (selected === true)
            {
                colour = '#fb6f6f';
            }
            else
            {
                colour = '#707070';
            }

            break;

        case 'sad':
            
            if (selected === true)
            {
                colour = '#5f78f7';
            }
            else
            {
                colour = '#707070';
            }

            break;
    }

    // Getting appropriate reaction text
    var text = document.querySelector('#' + type + 'Reaction');
    
    // Updating text colour
    text.setAttribute('text', {
        color: colour   
    });
}

// Component
AFRAME.registerComponent('button_interaction', 
{
    schema: 
    {
        // What button is being interacted with (envy, happy, angry, or sad)
        type : {type: 'string', default:''},

        // If the button is currently clicked
        clicked : {type: 'boolean', default:false},

        // If the button state has changed
        changed : {type: 'boolean', default:false}
    },

    init : function() 
    {
        const CONTEXT_AF = this;

        const element = CONTEXT_AF.el;

        // Getting the button
        var button = document.querySelector('#' + CONTEXT_AF.data.type + 'Button');
        
        // If button is entered, highlight it
        element.addEventListener('mouseenter', function()
        {
            if (CONTEXT_AF.data.clicked === false)
            {
                highlightControl(button, CONTEXT_AF.data.type, true);
            }
        });

        // If button is left, unhighlight it
        element.addEventListener('mouseleave', function()
        {
            if (CONTEXT_AF.data.clicked === false)
            {
                highlightControl(button, CONTEXT_AF.data.type, false);
            }
        });

        // Checking every millisecond if the button stage has been changed
        // If it has, check if button has been clicked or unclicked
        // Play appropriate animation and update screen display to the corresponding update
        setInterval(function()
        {
            if (CONTEXT_AF.data.changed === true)
            {
                if (CONTEXT_AF.data.clicked === false)
                {
                    button.setAttribute('animation__down', {enabled: false});
                    button.setAttribute('animation__up', {enabled: true});

                    highlightControl(button, CONTEXT_AF.data.type, false);
                    updateScreen(CONTEXT_AF.data.type, false);
                }
                else
                {
                    button.setAttribute('animation__up', {enabled: false});
                    button.setAttribute('animation__down', {enabled: true});

                    highlightControl(button, CONTEXT_AF.data.type, true);
                    updateScreen(CONTEXT_AF.data.type, true);
                }

                CONTEXT_AF.data.changed = false;
            }
        }, 100);
    }
});