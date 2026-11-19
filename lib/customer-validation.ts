export function validateCustomerDetails(
  rawName: string,
  rawPhone: string,
) {
  const name = rawName.normalize("NFC").trim().replace(/\s+/g, " ");

  // Allow letters, including Nepali, plus common name punctuation.
  const allowedName = /^[\p{L}\p{M} .'’\-]+$/u;
  const containsLetter = /\p{L}/u;

  if (
    name.length < 2 ||
    name.length > 100 ||
    !allowedName.test(name) ||
    !containsLetter.test(name)
  ) {
    return {
      error: "Enter a name using letters, without numbers or other symbols.",
    };
  }

  let phone = rawPhone.trim().replace(/[\s()-]/g, "");

  if (phone.startsWith("+977")) {
    phone = phone.slice(4);
  }

  if (!/^9\d{9}$/.test(phone)) {
    return {
      error: "Enter a 10-digit mobile number starting with 9.",
    };
  }

  return { name, phone };
}