import React from 'react';
import '../App.css'; // Make sure to import App.css to get the button style

function ContactPage() {
    // --- IMPORTANT ---
    // Change this to your actual email address
    const contactEmail = "wolfkame@bentonvillek12.org";

    // You can also pre-fill the subject line
    const subject = "BHS Tutoring Inquiry";

    // This creates the special mailto link
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;

    return (
        <div>
            <h2>Contact Us</h2>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em' }}>
                Have questions about tutoring? Want to learn more about joining Mu Alpha Theta?
            </p>
            <p style={{ lineHeight: 1.7, fontSize: '1.1em', marginTop: '1em' }}>
                The best way to get in touch is to email the faculty sponsor or student officers directly.
                Click the button below to start an email.
            </p>

            {/* This is the new part. We re-use the "book-button" class
        from App.css to make it look like a professional button.
      */}
            <a
                href={mailtoLink}
                className="book-button"
                style={{ marginTop: '20px', textDecoration: 'none' }}
            >
                Email the Tutoring Lead
            </a>

            <ul style={{ lineHeight: 1.7, fontSize: '1.1em', margin: '40px 0 0 20px' }}>
                <li><strong>Tutoring Lead:</strong> Megan Wolfka</li>
                <li><strong>Student President:</strong> Koree Arndt</li>
                <li>
                    <strong>Contact Email:</strong>
                    <a href={mailtoLink}> {contactEmail}</a>
                </li>
            </ul>
        </div>
    );
}

export default ContactPage;