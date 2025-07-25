var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "../integrations/supabase/client";
export function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return twMerge(clsx(inputs));
}
export function createUserProfile(email, role, data) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, authData, authError, _b, profile, profileError, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, supabase.auth.signUp({
                            email: email,
                            password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
                            options: {
                                data: {
                                    role: role
                                }
                            }
                        })];
                case 1:
                    _a = _d.sent(), authData = _a.data, authError = _a.error;
                    if (authError)
                        throw authError;
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .insert({
                            id: (_c = authData.user) === null || _c === void 0 ? void 0 : _c.id,
                            email: email,
                            first_name: 'first_name' in data ? data.first_name : data.contact_person_first_name,
                            last_name: 'last_name' in data ? data.last_name : data.contact_person_last_name,
                            phone: data.phone,
                            role: role,
                            email_verified: false
                        })
                            .select()
                            .single()];
                case 2:
                    _b = _d.sent(), profile = _b.data, profileError = _b.error;
                    if (profileError)
                        throw profileError;
                    // Send notification
                    return [4 /*yield*/, supabase
                            .from('notifications')
                            .insert({
                            user_id: profile.id,
                            title: "Welcome to BeautyFetch",
                            message: "Your account has been created. Please check your email for login instructions.",
                            type: 'welcome'
                        })];
                case 3:
                    // Send notification
                    _d.sent();
                    return [2 /*return*/, profile];
                case 4:
                    error_1 = _d.sent();
                    console.error('Error creating user profile:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function handleApplicationApproval(type, id, reviewData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, application_1, appError, updateError, profile, storeError, admins, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 10, , 11]);
                    return [4 /*yield*/, supabase
                            .from(type === 'driver' ? 'driver_applications' : 'merchant_applications')
                            .select('*')
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _b.sent(), application_1 = _a.data, appError = _a.error;
                    if (appError)
                        throw appError;
                    return [4 /*yield*/, supabase
                            .from(type === 'driver' ? 'driver_applications' : 'merchant_applications')
                            .update(reviewData)
                            .eq('id', id)];
                case 2:
                    updateError = (_b.sent()).error;
                    if (updateError)
                        throw updateError;
                    if (!(reviewData.status === 'approved')) return [3 /*break*/, 5];
                    return [4 /*yield*/, createUserProfile(application_1.email, type === 'driver' ? 'driver' : 'store_owner', application_1)];
                case 3:
                    profile = _b.sent();
                    if (!(type === 'merchant' && 'business_name' in application_1)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('stores')
                            .insert({
                            name: application_1.business_name,
                            slug: application_1.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            description: application_1.business_description,
                            owner_id: profile.id,
                            address: application_1.business_address,
                            phone: application_1.phone,
                            email: application_1.email,
                            status: 'active'
                        })];
                case 4:
                    storeError = (_b.sent()).error;
                    if (storeError)
                        throw storeError;
                    _b.label = 5;
                case 5: 
                // Send notification
                return [4 /*yield*/, supabase
                        .from('notifications')
                        .insert({
                        user_id: id, // Using application ID until profile is created
                        title: "".concat(type === 'driver' ? 'Driver' : 'Store', " Application ").concat(reviewData.status),
                        message: "Your ".concat(type, " application has been ").concat(reviewData.status, ". ").concat(reviewData.status === 'approved'
                            ? 'Please check your email for login instructions.'
                            : reviewData.status === 'needs_info'
                                ? 'Please provide the requested information.'
                                : 'Please contact support for more information.'),
                        type: "".concat(type, "_application"),
                        related_id: id
                    })];
                case 6:
                    // Send notification
                    _b.sent();
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .select('id')
                            .eq('role', 'admin')];
                case 7:
                    admins = (_b.sent()).data;
                    if (!admins) return [3 /*break*/, 9];
                    return [4 /*yield*/, Promise.all(admins.map(function (admin) {
                            return supabase
                                .from('notifications')
                                .insert({
                                user_id: admin.id,
                                title: "".concat(type === 'driver' ? 'Driver' : 'Store', " Application ").concat(reviewData.status),
                                message: "".concat('first_name' in application_1
                                    ? application_1.first_name
                                    : application_1.contact_person_first_name, " ").concat('last_name' in application_1
                                    ? application_1.last_name
                                    : application_1.contact_person_last_name, "'s application has been ").concat(reviewData.status, "."),
                                type: "".concat(type, "_application_review"),
                                related_id: id
                            });
                        }))];
                case 8:
                    _b.sent();
                    _b.label = 9;
                case 9: return [2 /*return*/, true];
                case 10:
                    error_2 = _b.sent();
                    console.error("Error handling ".concat(type, " application approval:"), error_2);
                    throw error_2;
                case 11: return [2 /*return*/];
            }
        });
    });
}
export function fixMissingProfiles() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, approvedMerchants, merchantError, _b, approvedDrivers, driverError, _i, _c, merchant, profile, error_3, _d, _e, driver, error_4, error_5;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 16, , 17]);
                    return [4 /*yield*/, supabase
                            .from('merchant_applications')
                            .select("\n        *,\n        profiles!inner(id)\n      ")
                            .eq('status', 'approved')];
                case 1:
                    _a = _f.sent(), approvedMerchants = _a.data, merchantError = _a.error;
                    if (merchantError)
                        throw merchantError;
                    return [4 /*yield*/, supabase
                            .from('driver_applications')
                            .select("\n        *,\n        profiles!inner(id)\n      ")
                            .eq('status', 'approved')];
                case 2:
                    _b = _f.sent(), approvedDrivers = _b.data, driverError = _b.error;
                    if (driverError)
                        throw driverError;
                    _i = 0, _c = approvedMerchants || [];
                    _f.label = 3;
                case 3:
                    if (!(_i < _c.length)) return [3 /*break*/, 9];
                    merchant = _c[_i];
                    _f.label = 4;
                case 4:
                    _f.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, createUserProfile(merchant.email, 'store_owner', merchant)];
                case 5:
                    profile = _f.sent();
                    // Create store
                    return [4 /*yield*/, supabase
                            .from('stores')
                            .insert({
                            name: merchant.business_name,
                            slug: merchant.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            description: merchant.business_description,
                            owner_id: profile.id,
                            address: merchant.business_address,
                            phone: merchant.phone,
                            email: merchant.email,
                            status: 'active'
                        })];
                case 6:
                    // Create store
                    _f.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _f.sent();
                    console.error("Error fixing merchant ".concat(merchant.id, ":"), error_3);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9:
                    _d = 0, _e = approvedDrivers || [];
                    _f.label = 10;
                case 10:
                    if (!(_d < _e.length)) return [3 /*break*/, 15];
                    driver = _e[_d];
                    _f.label = 11;
                case 11:
                    _f.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, createUserProfile(driver.email, 'driver', driver)];
                case 12:
                    _f.sent();
                    return [3 /*break*/, 14];
                case 13:
                    error_4 = _f.sent();
                    console.error("Error fixing driver ".concat(driver.id, ":"), error_4);
                    return [3 /*break*/, 14];
                case 14:
                    _d++;
                    return [3 /*break*/, 10];
                case 15: return [2 /*return*/, true];
                case 16:
                    error_5 = _f.sent();
                    console.error('Error fixing missing profiles:', error_5);
                    throw error_5;
                case 17: return [2 /*return*/];
            }
        });
    });
}
