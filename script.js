document.addEventListener("DOMContentLoaded", function () {
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: ['dayGrid'],
        events: events,
        eventClick: handleEventClick,
        selectable: true,
        select: handleDateSelect,
        editable: true,
        eventDrop: handleEventDrop,
    });

    calendar.render();

    function handleEventClick(info) {
        // Handle event click (e.g., show event details or delete option)
        if (confirm("Delete event '" + info.event.title + "'?")) {
            info.event.remove();
        }
    }

    function handleDateSelect(selectInfo) {
        // Handle date selection (e.g., open a modal to add a new event)
        const title = prompt("Event Title:");
        if (title) {
            calendar.addEvent({
                title: title,
                start: selectInfo.start,
                end: selectInfo.end,
                allDay: selectInfo.allDay,
            });
        }
        calendar.unselect();
    }

    function handleEventDrop(info) {
        // Handle event drop (e.g., update event date in the database)
        // You can add backend logic to update the event in the database
        console.log(info.event.title + " was dropped on " + info.event.start.toISOString());
    }
});