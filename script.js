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
                    category: event.category,  // Keep the existing category
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
                theme: 'light',
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

    $('#apply-filter').on('click', function () {
        updateFullCalendarEvents();
    });
    
    function updateFullCalendarEvents() {
        var selectedCategory = $('#category-filter').val();
    
        var filteredEvents = (selectedCategory === 'all') ?
            eventDatabase.events :
            eventDatabase.events.filter(function (event) {
                return event.category === selectedCategory;
            });
    
        calendar.fullCalendar('removeEvents');
        calendar.fullCalendar('addEventSource', filteredEvents);
    }

    function promptForEventDetails(existingEvent) {
        var title = prompt('Event Title:', existingEvent.title || '');
        if (title !== null) {
            var start = existingEvent.start ? moment(existingEvent.start) : null;
            var end = existingEvent.end ? moment(existingEvent.end) : null;
    
            var category = prompt('Event Category (e.g., Work, Personal):', existingEvent.category || 'default');
    
            var newEvent = {
                _id: existingEvent._id || generateUniqueId(),
                title: title,
                start: start,
                end: end,
                color: prompt('Event Color:', existingEvent.color || ''),
                description: prompt('Event Description:', existingEvent.description || ''),
                category: category.toLowerCase(),  // Convert to lowercase for consistency
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


    function getWeather(city) {
        var apiKey = '29c5ba96d56b06773fe801eae90b026d';
        var apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=29c5ba96d56b06773fe801eae90b026d`;

        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function (data) {
                displayWeather(data);
            },
            error: function (error) {
                console.error('Error fetching weather data:', error);
            }
        });
    }

    function displayWeather(data) {
        var weatherInfo = $('#weather-info');
        weatherInfo.empty();

        if (data.weather && data.weather.length > 0) {
            var weatherDescription = data.weather[0].description;
            var temperature = (data.main && data.main.temp) ? data.main.temp : '';
            var humidity = (data.main && data.main.humidity) ? data.main.humidity : '';
            var windSpeed = (data.wind && data.wind.speed) ? data.wind.speed : '';

            var weatherHtml = `<p><strong>Description:</strong> ${weatherDescription}</p>`;
            weatherHtml += `<p><strong>Temperature:</strong> ${temperature} K</p>`;
            weatherHtml += `<p><strong>Humidity:</strong> ${humidity}%</p>`;
            weatherHtml += `<p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>`;

            weatherInfo.html(weatherHtml);
        } else {
            weatherInfo.html('<p>No weather data available.</p>');
        }
    }

    // Example: Get weather for Chicago
    getWeather('Chicago');

});