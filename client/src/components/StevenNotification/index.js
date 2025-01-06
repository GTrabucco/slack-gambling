import React, { useEffect, useState } from "react";
import { Alert } from 'react-bootstrap';

const StevenNotification = ({ message, setMessage, type }) => {
    const [messageVisible, setMessageVisible] = useState(false)
    useEffect(()=>{
        const showMessage = () => {
                setMessageVisible(true)
                window.setTimeout(()=>{
                setMessageVisible(false)
                setMessage("")
            },2000)
        }  

        if (message) {
            console.log(message)
            showMessage()
        }
    }, [message])

    return (
        messageVisible && (
            <Alert variant="success" >
                {message}
            </Alert>    
        ) 
    )
}

export default StevenNotification