import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export const StevenTableContainer = ({ children, sx = {}, ...props }) => (
  <TableContainer component={Paper} sx={{ width: "100%", ...sx }} {...props}>
    {children}
  </TableContainer>
);

export const StevenTable = ({ children, size = "small", ...props }) => (
  <Table size={size} {...props}>
    {children}
  </Table>
);

export const StevenTableHead = TableHead;
export const StevenTableBody = TableBody;
export const StevenTableRow = TableRow;
export const StevenTableCell = TableCell;
