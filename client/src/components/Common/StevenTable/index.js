import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled } from "@mui/material";

export const StevenTableContainer = ({ children, sx = {}, ...props }) => (
    <TableContainer
        component={Paper}
        sx={{
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundImage: "none",
            ...sx,
        }}
        {...props}
    >
        {children}
    </TableContainer>
);

export const StevenTable = ({ children, size = "small", ...props }) => (
    <Table size={size} sx={{ minWidth: 320 }} {...props}>
        {children}
    </Table>
);

export const StevenTableHead = styled(TableHead)(() => ({
    "& .MuiTableCell-head": {
        backgroundColor: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        whiteSpace: "nowrap",
        padding: "10px 16px",
    },
}));

export const StevenTableBody = styled(TableBody)(() => ({
    "& .MuiTableRow-root:nth-of-type(odd)": {
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    "& .MuiTableRow-root:hover": {
        backgroundColor: "rgba(255,255,255,0.05)",
        transition: "background-color 0.15s ease",
    },
    "& .MuiTableRow-root:last-child .MuiTableCell-root": {
        borderBottom: "none",
    },
}));

export const StevenTableRow = styled(TableRow)(() => ({
    transition: "background-color 0.15s ease",
}));

export const StevenTableCell = styled(TableCell)(() => ({
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: 13,
    padding: "10px 16px",
    whiteSpace: "nowrap",
}));
