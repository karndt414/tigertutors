import React from 'react';

function ContactPage() {
    return (
        <div>
            <h2>Contact Us</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em' }}>
                Have questions about tutoring? Want to learn more about joining Mu Alpha Theta?
            </p>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', marginTop: '1em' }}>
                Please reach out to our tutoring lead!
            </p>
            <ul style={{ lineHeight: 1.7, fontSize: '1.1em', margin: '20px 0 0 20px' }}>
                <li><strong>Tutoring Coordinator:</strong> Meg Wolfka at [mwolfka@bentonvillek12.org]</li>
            </ul>
        </div>
    );
}

export default ContactPage;