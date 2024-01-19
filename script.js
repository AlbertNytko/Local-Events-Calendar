document.addEventListener('DOMContentLoaded', function () {
    // In-memory database
    var eventDatabase = {
        events: [],
        currentUser: null,
        addEvent: function (event) {
            this.events.push(event);
            updateStoredUserEvents(this.currentUser, this.events);
            updateFullCalendarEvents();
        },
        updateEvent: function (updatedEvent) {
            var index = this.events.findIndex(function (event) {
                return event._id === updatedEvent._id;
            });
            if (index !== -1) {
                this.events[index] = updatedEvent;
                updateStoredUserEvents(this.currentUser, this.events);
                updateFullCalendarEvents();
            }
        },
        removeEvent: function (eventId) {
            this.events = this.events.filter(function (event) {
                return event._id !== eventId;
            });
            updateStoredUserEvents(this.currentUser, this.events);
            updateFullCalendarEvents();
        }
    };

    var calendar = $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'year,month,agendaWeek,agendaDay'
        },
        customButtons: {
            yearButton: {
                text: 'Year',
                click: function () {
                    calendar.fullCalendar('changeView', 'year');
                }
            },
            monthButton: {
                text: 'Month',
                click: function () {
                    calendar.fullCalendar('changeView', 'month');
                }
            },
            weekButton: {
                text: 'Week',
                click: function () {
                    calendar.fullCalendar('changeView', 'agendaWeek');
                }
            },
            dayButton: {
                text: 'Day',
                click: function () {
                    calendar.fullCalendar('changeView', 'agendaDay');
                }
            }
        },
        editable: true,
        events: eventDatabase.events,

        eventDrop: function (event, delta, revertFunc) {
            // Get the new dates
            var newStartDate = event.start.format();
            var newEndDate = (event.end) ? event.end.format() : null;
        
            // Ask for confirmation
            var confirmMove = confirm('Are you sure you want to move this event to ' + newStartDate + '?');
            if (confirmMove) {
                // Update the event directly in the in-memory database
                var updatedEvent = {
                    _id: event._id,
                    title: event.title,
                    start: newStartDate,
                    end: newEndDate,
                    color: event.color,
                    description: event.description,
                    details: event.details,
                    // Add other properties as needed
                };
        
                var index = eventDatabase.events.findIndex(function (e) {
                    return e._id === updatedEvent._id;
                });
        
                if (index !== -1) {
                    eventDatabase.events[index] = updatedEvent;
        
                    // Update the FullCalendar events source
                    updateFullCalendarEvents();
        
                    // Save the updated events to localStorage
                    updateStoredUserEvents(eventDatabase.currentUser, eventDatabase.events);
                }
            } else {
                // If not confirmed, revert the event back to its original position
                revertFunc();
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
            var startTime = prompt('Event Start Time (HH:mm):', '09:00');
            var endTime = prompt('Event End Time (HH:mm):', '10:00');

            var newEvent = promptForEventDetails({
                start: moment(date.format('YYYY-MM-DD') + ' ' + startTime),
                end: moment(date.format('YYYY-MM-DD') + ' ' + endTime),
            });

            if (newEvent) {
                eventDatabase.addEvent(newEvent);
            }
        },
        eventRender: function (event, element) {
            var timeRange = formatTimeRange(event.start, event.end);
            var description = event.description || '';
    
            var tooltipContent = '<strong>' + event.title + '</strong><br>' + timeRange + '<br>' + description;
    
            tippy(element[0], {
                content: tooltipContent,
                allowHTML: true,
                theme: 'light', // You can customize the theme
                placement: 'top',
            });
    
            if (event.icon) {
                element.find('.fc-title').prepend('<img src="' + event.icon + '" class="event-icon" />');
            }
        }
    });

    // User Authentication
    $('#login').on('click', function () {
        var username = $('#username').val();
        if (username.trim() !== '') {
            eventDatabase.currentUser = username;
            loadUserEvents();
            $('#authentication').hide();
        }
    });

    $('#logout').on('click', function () {
        eventDatabase.currentUser = null;
        $('#authentication').show();
        clearCalendar();
    });

    function loadUserEvents() {
        var userEvents = getStoredUserEvents(eventDatabase.currentUser) || [];
        eventDatabase.events = userEvents;
        updateFullCalendarEvents();
    }

    function getStoredUserEvents(username) {
        var storedEvents = localStorage.getItem('calendarEvents_' + username);
        try {
            return storedEvents ? JSON.parse(storedEvents) : [];
        } catch (error) {
            console.error('Error parsing stored events:', error);
            return [];
        }
    }

    function updateStoredUserEvents(username, events) {
        localStorage.setItem('calendarEvents_' + username, JSON.stringify(events));
    }

    function clearCalendar() {
        calendar.fullCalendar('removeEvents');
    }

    // Theme selector
    $('#theme-selector').on('change', function () {
        var selectedTheme = $(this).val();
        $('body').removeClass('dark-theme light-theme red-theme blue-theme green-theme purple-theme orange-theme teal-theme pink-theme').addClass(selectedTheme);
    });

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
                description: prompt('Event Description:', existingEvent.description || ''),
                details: prompt('Event Details:', existingEvent.details || ''),
            };

            return newEvent;
        }
        return null;
    }

    function formatTimeRange(start, end) {
        var timeFormat = 'h:mm A';
        var formattedTimeRange = '';
    
        if (start) {
            formattedTimeRange += start.format(timeFormat);
        }
    
        if (end) {
            if (formattedTimeRange.length > 0) {
                formattedTimeRange += ' - ';
            }
            formattedTimeRange += end.format(timeFormat);
        }
    
        return formattedTimeRange;
    }

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
});