
import { auth } from './api/modules/auth';
import { users } from './api/modules/users';
import { products } from './api/modules/products';
import { customers } from './api/modules/customers';
import { suppliers } from './api/modules/suppliers';
import { categories } from './api/modules/categories';
import { analytics } from './api/modules/analytics';
import { companies } from './api/modules/companies';
import { salesReturns } from './api/modules/salesReturns';
import { invoices } from './api/modules/invoices';
import { purchaseInvoices } from './api/modules/purchaseInvoices';
import { finance } from './api/modules/finance';

export const api = {
  auth,
  users,
  products,
  customers,
  suppliers,
  categories,
  analytics,
  companies,
  salesReturns,
  invoices,
  purchaseInvoices,
  finance
};
