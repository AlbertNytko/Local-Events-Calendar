document.addEventListener('DOMContentLoaded', function() {
    // Initialize FullCalendar
    var calendar = $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true, // Enable draggable events
        events: [
            {
                title: 'Event 1',
                start: '2024-01-15T10:00:00',
                end: '2024-01-15T12:00:00',
                color: '#007bff', // Blue color
                icon: 'path/to/icon1.svg'  // Replace with my icon path
            },
            {
                title: 'Event 2',
                start: '2024-01-16T14:00:00',
                end: '2024-01-16T16:00:00',
                color: '#28a745', // Green color
                icon: 'path/to/icon2.svg'  // Replace my icon path when found
            }
            // Add more events with different colors and icons as needed
        ],
        // Event drop callback
        eventDrop: function(event, delta, revertFunc) {
            alert('Event dropped on ' + event.start.format());
        },
        // Event click callback
        eventClick: function(event) {
            var title = prompt('Event Title:', event.title);
            if (title) {
                event.title = title;
                calendar.fullCalendar('updateEvent', event);
            }
        },
        // Day click callback for adding new events
        dayClick: function(date, jsEvent, view) {
            var title = prompt('Event Title:');
            if (title) {
                calendar.fullCalendar('renderEvent', {
                    title: title,
                    start: date,
                    allDay: true
                });
            }
        },
        // Event render callback to display custom icons
        eventRender: function(event, element) {
            if (event.icon) {
                element.find('.fc-title').prepend('<img src="' + event.icon + '" class="event-icon" />');
            }
        }
    });
});