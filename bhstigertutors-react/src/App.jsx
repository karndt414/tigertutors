import React from 'react';
import TutorCard from './TutorCard'; // Import the component
import { tutors } from './tutors';     // Import the data
import './App.css';                   // You can put the grid styles here

function App() {
  return (
    <div className="App">
      <h1>Meet the Tutors</h1>
      <div className="tutor-grid">
        {/* We loop over the 'tutors' data and create a card for each one */}
        {tutors.map(tutor => (
          <TutorCard
            key={tutor.id} // A unique key React needs
            name={tutor.name}
            subjects={tutor.subjects}
            photo={tutor.photo}
            bookingLink={tutor.bookingLink}
          />
        ))}
      </div>
    </div>
  );
}

export default App;