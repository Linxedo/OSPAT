import React, { useEffect } from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { useForm, useFieldArray } from 'react-hook-form'

const QuestionModal = ({ show, onHide, editingQuestion, onSubmit, loading }) => {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        defaultValues: {
            question_text: '',
            answers: [{ answer_text: '', score: 0 }]
        }
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'answers' })

    useEffect(() => {
        if (show) {
            if (editingQuestion) {
                reset({
                    question_text: editingQuestion.question_text,
                    answers: editingQuestion.answers?.length > 0 ? editingQuestion.answers : [{ answer_text: '', score: 0 }]
                })
            } else {
                reset({
                    question_text: '',
                    answers: [{ answer_text: '', score: 0 }]
                })
            }
        }
    }, [show, editingQuestion, reset])

    const handleFormSubmit = (data) => {
        onSubmit(data)
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)' }}>
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    {editingQuestion ? 'Edit' : 'Add'} Question
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: 'var(--bg-card)' }}>
                <Form onSubmit={handleSubmit(handleFormSubmit)}>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'var(--text-primary)' }}>Question Text</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3}
                            {...register('question_text', { required: 'Question text is required' })}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            isInvalid={!!errors.question_text}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.question_text?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Label style={{ color: 'var(--text-primary)' }}>Answers</Form.Label>
                    {fields.map((field, index) => (
                        <div key={field.id} className="d-flex gap-2 mb-2">
                            <Form.Control 
                                {...register(`answers.${index}.answer_text`, { required: 'Answer text is required' })}
                                placeholder="Answer"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Form.Control 
                                type="number" 
                                {...register(`answers.${index}.score`, { valueAsNumber: true, required: 'Score is required' })}
                                placeholder="Score"
                                style={{ 
                                    width: '80px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Button 
                                variant="outline-danger" 
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                            >
                                ×
                            </Button>
                        </div>
                    ))}
                    <Button 
                        variant="link" 
                        onClick={() => append({ answer_text: '', score: 0 })}
                        className="p-0"
                        style={{ color: 'var(--accent-primary)' }}
                    >
                        + Add Answer
                    </Button>
                    
                    <hr />
                    <div className="d-flex justify-content-end gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={onHide}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                backgroundColor: 'var(--accent-primary)',
                                borderColor: 'var(--accent-primary)'
                            }}
                        >
                            {loading ? 'Saving...' : 'Save Question'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

export default QuestionModal
