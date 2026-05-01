import React, { useState } from "react"
import { useAtom } from "jotai"
import { isEmailLoginModalOpenAtom } from "@/app/(main)/_atoms/server-status.atoms"
import { Modal } from "@/components/ui/modal"
import { defineSchema, Field, Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { LuMail, LuLock, LuArrowRight, LuUser } from "react-icons/lu"
import { useTranslation } from "@/lib/i18n/use-translation"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

import { FcGoogle } from "react-icons/fc"

const emailLoginSchema = defineSchema(({ z }) => z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    rememberMe: z.boolean().default(true),
}))

const emailResetSchema = defineSchema(({ z }) => z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
}))

const emailRegisterSchema = defineSchema(({ z }) => z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    registerUsername: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    passwordConfirm: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
}))

const updatePasswordSchema = defineSchema(({ z }) => z.object({
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    passwordConfirm: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
}))

export function EmailLoginModal() {
    const t = useTranslation()
    const [open, setOpen] = useAtom(isEmailLoginModalOpenAtom)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<"login" | "register" | "forgot-password" | "update-password">("login")

    const handleLoginSubmit = async (data: any) => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })
        
        setIsLoading(false)
        
        if (error) {
            toast.error("Giriş başarısız", { description: error.message })
            return
        }
        
        toast.success("Başarıyla giriş yapıldı")
        setOpen(false)
    }

    const handleRegisterSubmit = async (data: any) => {
        console.log("Register data:", data)
        if (data.password !== data.passwordConfirm) {
            toast.error("Hata", { description: "Şifreler eşleşmiyor!" })
            return
        }
        setIsLoading(true)
        
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.registerUsername,
                }
            }
        })
        
        setIsLoading(false)
        
        if (error) {
            toast.error("Kayıt başarısız", { description: error.message })
            return
        }
        
        toast.success("Kayıt başarılı", { description: "Lütfen e-posta adresinizi doğrulayın." })
        setMode("login")
    }

    const handleResetSubmit = async (data: any) => {
        setIsLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: window.location.origin,
        })
        setIsLoading(false)

        if (error) {
            toast.error("Hata", { description: error.message })
            return
        }

        toast.success("E-posta gönderildi", { description: "Şifre sıfırlama bağlantısı e-postanıza gönderildi." })
        setMode("login")
    }

    const handleUpdatePasswordSubmit = async (data: any) => {
        if (data.password !== data.passwordConfirm) {
            toast.error("Hata", { description: "Şifreler eşleşmiyor!" })
            return
        }
        
        setIsLoading(true)
        const { error } = await supabase.auth.updateUser({
            password: data.password
        })
        setIsLoading(false)

        if (error) {
            toast.error("Hata", { description: error.message })
            return
        }

        toast.success("Başarılı", { description: "Şifreniz başarıyla güncellendi!" })
        setMode("login")
        setOpen(false)
    }

    // Capture password recovery event from Supabase URL fragment
    React.useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                setMode("update-password")
                setOpen(true)
            }
        })
        
        return () => subscription.unsubscribe()
    }, [])

    // Reset mode to login when modal opens (unless it's update-password mode)
    React.useEffect(() => {
        if (open && mode !== "update-password") setMode("login")
    }, [open])

    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title={mode === "login" ? "E-posta ile Giriş Yap" : mode === "register" ? "Hesap Oluştur" : mode === "forgot-password" ? "Şifremi Unuttum" : "Yeni Şifre Belirle"}
            description={mode === "login" ? "Hesabınıza erişmek için e-posta ve şifrenizi girin." : mode === "register" ? "Yeni bir hesap oluşturmak için bilgilerinizi girin." : mode === "forgot-password" ? "Şifrenizi sıfırlamak için e-posta adresinizi girin." : "Lütfen yeni şifrenizi girin."}
            contentClass="max-w-md border border-white/10 shadow-2xl backdrop-blur-xl bg-gray-950/90"
        >
            <div className="mt-6">
                {mode === "login" ? (
                    <Form
                        schema={emailLoginSchema}
                        onSubmit={handleLoginSubmit}
                        defaultValues={{ email: "", password: "", rememberMe: true }}
                    >
                        <div className="space-y-6">
                            <Field.Text
                                name="email"
                                label="E-posta Adresi"
                                placeholder="ornek@email.com"
                                leftIcon={<LuMail className="text-gray-400" />}
                            />
                            <Field.Text
                                name="password"
                                label="Şifre"
                                placeholder="••••••••"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                            />
                            
                            <div className="flex items-center justify-between">
                                <Field.Checkbox
                                    name="rememberMe"
                                    label="Beni hatırla"
                                    className="text-sm font-medium text-gray-300"
                                />
                                <button 
                                    type="button"
                                    className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
                                    onClick={() => setMode("forgot-password")}
                                >
                                    Şifremi unuttum
                                </button>
                            </div>
                            
                            <div className="pt-2 space-y-3">
                                <Field.Submit 
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-900/20"
                                    loading={isLoading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Giriş Yap <LuArrowRight className="text-lg" />
                                    </span>
                                </Field.Submit>
                                
                                <button 
                                    type="button"
                                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 bg-transparent text-gray-200 font-medium transition-all duration-300 shadow-sm"
                                    onClick={() => toast.info("Google ile giriş şu an aktif değil.")}
                                >
                                    <FcGoogle className="text-2xl" /> <span>Google ile Giriş Yap</span>
                                </button>
                            </div>
                        </div>
                    </Form>
                ) : mode === "register" ? (
                    <Form
                        schema={emailRegisterSchema}
                        onSubmit={handleRegisterSubmit}
                        defaultValues={{ email: "", registerUsername: "", password: "", passwordConfirm: "" }}
                    >
                        <div className="space-y-4">
                            {/* Browser autofill trap */}
                            <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
                            <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
                            
                            <Field.Text
                                name="email"
                                label="E-posta Adresi"
                                placeholder="ornek@email.com"
                                leftIcon={<LuMail className="text-gray-400" />}
                            />
                            <Field.Text
                                name="registerUsername"
                                label="Kullanıcı Adı"
                                placeholder="Kullanıcı adınız"
                                leftIcon={<LuUser className="text-gray-400" />}
                                autoComplete="off"
                                data-lpignore="true"
                            />
                            <Field.Text
                                name="password"
                                label="Şifre"
                                placeholder="••••••••"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                                autoComplete="new-password"
                            />
                            <Field.Text
                                name="passwordConfirm"
                                label="Tekrar Şifre"
                                placeholder="••••••••"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                                autoComplete="new-password"
                            />
                            
                            <div className="pt-4">
                                <Field.Submit 
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-900/20"
                                    loading={isLoading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Kayıt Ol <LuArrowRight className="text-lg" />
                                    </span>
                                </Field.Submit>
                            </div>
                        </div>
                    </Form>
                ) : mode === "forgot-password" ? (
                    <Form
                        schema={emailResetSchema}
                        onSubmit={handleResetSubmit}
                        defaultValues={{ email: "" }}
                    >
                        <div className="space-y-6">
                            <Field.Text
                                name="email"
                                label="E-posta Adresi"
                                placeholder="ornek@email.com"
                                leftIcon={<LuMail className="text-gray-400" />}
                            />
                            
                            <div className="pt-2">
                                <Field.Submit 
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-900/20"
                                    loading={isLoading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Şifre Sıfırlama Bağlantısı Gönder <LuArrowRight className="text-lg" />
                                    </span>
                                </Field.Submit>
                            </div>
                        </div>
                    </Form>
                ) : (
                    <Form
                        schema={updatePasswordSchema}
                        onSubmit={handleUpdatePasswordSubmit}
                        defaultValues={{ password: "", passwordConfirm: "" }}
                    >
                        <div className="space-y-4">
                            <Field.Text
                                name="password"
                                label="Yeni Şifre"
                                placeholder="••••••••"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                                autoComplete="new-password"
                            />
                            <Field.Text
                                name="passwordConfirm"
                                label="Tekrar Yeni Şifre"
                                placeholder="••••••••"
                                type="password"
                                leftIcon={<LuLock className="text-gray-400" />}
                                autoComplete="new-password"
                            />
                            
                            <div className="pt-4">
                                <Field.Submit 
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-900/20"
                                    loading={isLoading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Şifreyi Güncelle <LuArrowRight className="text-lg" />
                                    </span>
                                </Field.Submit>
                            </div>
                        </div>
                    </Form>
                )}

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <p className="text-sm text-gray-500">
                        {mode === "login" ? (
                            <>
                                Henüz bir hesabınız yok mu?{" "}
                                <button 
                                    className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                                    onClick={() => setMode("register")}
                                >
                                    Kayıt Ol
                                </button>
                            </>
                        ) : mode === "register" ? (
                            <>
                                Zaten bir hesabınız var mı?{" "}
                                <button 
                                    className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                                    onClick={() => setMode("login")}
                                >
                                    Giriş Yap
                                </button>
                            </>
                        ) : mode === "forgot-password" ? (
                            <button 
                                className="text-brand-400 hover:text-brand-300 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                                onClick={() => setMode("login")}
                            >
                                <LuArrowRight className="rotate-180 text-lg" /> Giriş Ekranına Dön
                            </button>
                        ) : null}
                    </p>
                </div>
            </div>
        </Modal>
    )
}
