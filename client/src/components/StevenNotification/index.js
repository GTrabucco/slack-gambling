import React, { useEffect, useState } from "react";
import { Toast } from 'react-bootstrap';

const StevenNotification = ({ message, setMessage, type }) => {
    const [messageVisible, setMessageVisible] = useState(false)
    useEffect(() => {
        const showMessage = () => {
            setMessageVisible(true)
            window.setTimeout(() => {
                setMessageVisible(false)
                setMessage("")
            }, 3000)
        }

        if (message) {
            showMessage()
        }
    }, [message])

    return (
        <div>
            <div
                aria-live="polite"
                aria-atomic="true"
                className="position-fixed top-0 start-0 p-3"
                style={{ zIndex: 1050 }}
            >
                <Toast onClose={() => setMessageVisible(false)} show={messageVisible} delay={3000} autohide>
                    <Toast.Header>
                        <strong className="me-auto">{message}</strong>
                    </Toast.Header>
                </Toast>
            </div>
        </div>
    );
}

export default StevenNotification