import React from 'react';

function ContactPage() {
    return (
        <div>
            <h2>Contact Us</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em' }}>
                Have questions about tutoring? Want to learn more about joining Mu Alpha Theta?
            </p>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', marginTop: '1em' }}>
                Please reach out to our faculty sponsor or the student officers.
            </p>
            <ul style={{ lineHeight: 1.7, fontSize: '1.1em', margin: '20px 0 0 20px' }}>
                <li><strong>Faculty Sponsor:</strong> [Sponsor Name] at [sponsor@email.com]</li>
                <li><strong>President:</strong> [Your Name] at [your@email.com]</li>
            </ul>
        </div>
    );
}

export default ContactPage;