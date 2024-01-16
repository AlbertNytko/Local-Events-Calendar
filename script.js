document.addEventListener('DOMContentLoaded', function () {
    // In-memory database
    var eventDatabase = {
        events: getStoredEvents() || [],
        addEvent: function (event) {
            this.events.push(event);
            updateStoredEvents(this.events);
            updateFullCalendarEvents();
        },
        updateEvent: function (updatedEvent) {
            var index = this.events.findIndex(function (event) {
                return event._id === updatedEvent._id;
            });
            if (index !== -1) {
                this.events[index] = updatedEvent;
                updateStoredEvents(this.events);
                updateFullCalendarEvents();
            }
        },
        removeEvent: function (eventId) {
            this.events = this.events.filter(function (event) {
                return event._id !== eventId;
            });
            updateStoredEvents(this.events);
            updateFullCalendarEvents();
        }
    };

    var calendar = $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true,
        events: eventDatabase.events,
        eventDrop: function (event) {
            // Get the new date
            var newDate = event.start.format();

            // Ask for confirmation
            var confirmMove = confirm('Are you sure you want to move this event to ' + newDate + '?');
            if (confirmMove) {
                // Save the event first
                event.start = newDate;
                eventDatabase.updateEvent(event);

                // Update the FullCalendar events source
                updateFullCalendarEvents();
            }
        },
        eventClick: function (event) {
            var action = prompt('Do you want to edit or delete this event? Enter "edit" or "delete":');

            if (action === 'edit') {
                var updatedEvent = promptForEventDetails(event);
                if (updatedEvent) {
                    eventDatabase.updateEvent(updatedEvent);
                }
            } else if (action === 'delete') {
                var confirmDelete = confirm('Are you sure you want to delete this event?');
                if (confirmDelete) {
                    eventDatabase.removeEvent(event._id);
                }
            } else {
                alert('Invalid action. Please enter "edit" or "delete".');
            }
        },
        dayClick: function (date) {
            var newEvent = promptForEventDetails({ start: date, allDay: true });
            if (newEvent) {
                eventDatabase.addEvent(newEvent);
            }
        },
        eventRender: function (event, element) {
            if (event.icon) {
                element.find('.fc-title').prepend('<img src="' + event.icon + '" class="event-icon" />');
            }
        }
    });

    // Theme selector
    $('#theme-selector').on('change', function () {
        var selectedTheme = $(this).val();
        $('body').removeClass('dark-theme light-theme red-theme blue-theme green-theme purple-theme orange-theme teal-theme pink-theme').addClass(selectedTheme);
    });

    function getStoredEvents() {
        var storedEvents = localStorage.getItem('calendarEvents');
        try {
            return storedEvents ? JSON.parse(storedEvents) : [];
        } catch (error) {
            console.error('Error parsing stored events:', error);
            return [];
        }
    }

    function updateStoredEvents(events) {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }

    function updateFullCalendarEvents() {
        calendar.fullCalendar('removeEvents');
        calendar.fullCalendar('addEventSource', eventDatabase.events);
    }

    function promptForEventDetails(existingEvent) {
        var title = prompt('Event Title:', existingEvent.title || '');
        if (title !== null) {
            var start = existingEvent.start ? moment(existingEvent.start) : null;
            var end = existingEvent.end ? moment(existingEvent.end) : null;

            var newEvent = {
                _id: existingEvent._id || generateUniqueId(),
                title: title,
                start: start,
                end: end,
                color: prompt('Event Color:', existingEvent.color || ''),
            };

            return newEvent;
        }
        return null;
    }

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
});