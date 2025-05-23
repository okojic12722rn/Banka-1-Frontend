import React, { useState, useEffect } from "react";
import Sidebar from "../../components/mainComponents/Sidebar";
import SearchDataTable from "../../components/tables/SearchDataTable";
import EditModal from "../../components/common/EditModal";
import {
    fetchCustomers,
    fetchCustomerById,
    updateCustomer,
    createCustomer
} from "../../services/AxiosUser";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerPortal = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    // Correct the naming to match the pattern in EmployeePortal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phoneNumber: "",
        address: "",
        birthDate: "",
        gender: "MALE",
    });

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'firstName', headerName: 'First name', width: 130 },
        { field: 'lastName', headerName: 'Last name', width: 130 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phoneNumber', headerName: 'Phone', width: 150 },
    ];

    // Load the customer data on component mount when the page loads
    useEffect(() => {
        loadCustomers();
    }, []);
    // Load the customer data from the API
    const loadCustomers = async () => {
        try {
            setLoading(true);
            const data = await fetchCustomers();
            const rowData = data.data.rows;

            const formattedRows = rowData.map((row) => ({
                id: row.id,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phoneNumber: row.phoneNumber,
                // Store original data for potential updates
                originalData: { ...row }
            }));

            setRows(formattedRows);
        } catch (err) {
            console.error(err);
            setError("Failed to load customers data");
        } finally {
            setLoading(false);
        }
    };

    const validateEmail = (email) => {
        email = email.trim();
        console.log("Validating email:", email);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Invalid email format.");
            return false;
        }
        return true;
    };

    const validateCustomerData = (customer) => {
        let isValid = true;

        // Required fields
        Object.keys(customer).forEach((key) => {
            if (!customer[key] && key !== "id") {
                toast.error(`${key} is required.`);
                isValid = false;
            }
        });

        // Phone number validation ("+" is counted as a character)
        if (!customer.phoneNumber.startsWith("+381") || customer.phoneNumber.length !== 13) {
            toast.error("Phone number must start with +381 and have 8 digits after");
            isValid = false;
        }

        // Address validation (must contain a number at the end)
        const addressParts = customer.address.split(" ");
        const lastPart = addressParts[addressParts.length - 1];
        if (isNaN(Number(lastPart))) {
            toast.error("Address must contain a number");
            isValid = false;
        }

        // Email validation
        if (!validateEmail(customer.email)) {
            isValid = false;
        }

        return isValid;
    };
    // Format the date in the log to YYYY-MM-DD
    const formatLogDate = (log) => {
        if (typeof log !== "string" && typeof log !== "number") return String(log);

        const strLog = String(log);

        if (strLog.length === 8) {
            // Extract year, month, and day
            const year = strLog.slice(0, 4);
            const month = strLog.slice(4, 6);
            const day = strLog.slice(6, 8);

            return `${year}-${month}-${day}`; // Output format: YYYY-MM-DD
        }

        return strLog; // Return as-is if not in expected format
    };


    const convertBirthDateToISO = (birthDate) => {
        if (!birthDate) return '';
    
        // Ako je već u ISO formatu (yyyy-MM-dd), sve ok
        if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
            return birthDate;
        }
    
        // Ako je u formatu dd-MM-yyyy, konvertuj ga
        if (/^\d{2}-\d{2}-\d{4}$/.test(birthDate)) {
            const [day, month, year] = birthDate.split("-");
            return `${year}-${month}-${day}`;
        }
    
        return birthDate; // fallback
    };
    

    // Handle the row click event to open the edit modal with the customer data pre-filled in the form fields
    const handleRowClick = async (row) => {
        try {
            const response = await fetchCustomerById(row.id);

            const customerData = response.data || response;

            // Create a clean customer object
            const cleanCustomerData = {
                id: row.id,
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                username: customerData.username,
                email: customerData.email,
                phoneNumber: customerData.phoneNumber,
                address: customerData.address,
                // birthDate: convertToBackendFormat(customerData.birthDate),
                birthDate: convertBirthDateToISO(customerData.birthDate),

                // birthDate: customerData.birthDate,

                gender: customerData.gender
            };

            console.log("Dobijen birthDate:", customerData.birthDate);
            console.log("Konvertovan za input:", convertBirthDateToISO(customerData.birthDate));

            // Set the selected customer data and open the edit modal with the data pre-filled in the form fields
            setSelectedCustomer(cleanCustomerData);
            setIsEditModalOpen(true);
        } catch (error) {
            toast.error(`Error fetching customer details: ${error.message}`);
        }
    };

    const convertToBackendFormat = (isoDate) => {
        if (!isoDate) return '';
        
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}-${month}-${year}`;
        }
    
        return isoDate;
    };
    

    // Handle the save event when the user clicks the save button in the edit modal formm
    const handleSaveCustomer = async (updatedCustomerData) => {
        if (!validateCustomerData(updatedCustomerData)) return;
        try {

            // updatedCustomerData.birthDate = transformDateForApi(updatedCustomerData.birthDate);
            // console.log(updatedCustomerData.birthDate);

            // Update the customer data and show a success message
            await updateCustomer(updatedCustomerData.id, updatedCustomerData);
            setIsEditModalOpen(false);
            toast.success('Customer updated successfully');
            loadCustomers(); // Reload the data to reflect changes
        } catch (error) {
            toast.error(`Failed to update customer: ${error.message}`);
        }
    };

    const transformDateForApi = (dateString) => {
        if (!dateString) return null;
    
        try {
            const [day, month, year] = dateString.split('-');
            if (!day || !month || !year) return null;
    
            return `${year}-${month}-${day}`; // Obrnut redosled: YYYY-MM-DD
        } catch (error) {
            console.error('Error converting date:', error);
            return null;
        }
    };

    
    
    

    // Add create customer handler
    const handleCreateCustomer = async (customerData) => {
        if (!validateCustomerData(customerData)) return;
        try {
            customerData.birthDate = transformDateForApi(customerData.birthDate);

            console.log("Kreiranje korisnika – payload koji se šalje:", customerData);

            await createCustomer(customerData);
            setIsCreateModalOpen(false);
            resetCustomerForm();
            toast.success('Customer created successfully');
            loadCustomers();
        } catch (error) {
            toast.error(`Failed to create customer: ${error.message}`);
            console.error("Greška prilikom kreiranja korisnika:", error.response?.data || error);
        }
    };

    const resetCustomerForm = () => {
        setNewCustomer({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            phoneNumber: "",
            address: "",
            birthDate: "",
            gender: "MALE",
            // password: ""
        });
    };



    // Define the form fields for the customer form in the edit modal
    const customerFormFields = [
        { name: 'firstName', label: 'First Name', required: true },
        { name: 'lastName', label: 'Last Name', required: true },
        { name: 'username', label: 'Username', required: true },
        { name: 'email', label: 'Email', required: true, type: 'email' },
        { name: 'phoneNumber', label: 'Phone Number' },
        { name: 'address', label: 'Address' },
        { name: 'birthDate', label: 'Birth Date', type: 'date' },
        { name: 'gender', label: 'Gender', type: 'select', options: [
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' }
            ] }
    ];

    // Add password field for customer creation
    const createCustomerFormFields = [
        ...customerFormFields,
        // { name: 'password', label: 'Password', type: 'password', required: true }
    ];

    return (
        <div>
            <Sidebar/>
            <div style={{ padding: '20px', marginTop: '64px' }}>
                <h2>Customer Management</h2>
                {/* Loading view while fetching data */}
                {loading ? (
                    <p>Loading customer data...</p>
                ) : error ? (
                    <p>Error: {error}</p>
                ) : (
                    // Display the customer data in a table
                    <SearchDataTable
                        rows={rows}
                        columns={columns}
                        checkboxSelection={false}
                        onRowClick={handleRowClick}
                    />
                )}

                {/* Edit Modal */}
                {selectedCustomer && (
                    <EditModal
                        open={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        data={selectedCustomer}
                        formFields={customerFormFields}
                        onSave={handleSaveCustomer}
                        title="Edit Customer"
                    />
                )}

                {/* Create Modal */}
                <EditModal
                    open={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        resetCustomerForm();
                    }}
                    data={newCustomer}
                    formFields={createCustomerFormFields}
                    onSave={handleCreateCustomer}
                    title="Create New Customer"
                />

                {/*ovde ce biti ona 3 racuna*/}

                <ToastContainer position="bottom-right" />
            </div>
        </div>
    );
}

export default CustomerPortal;