package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.SolutionMapper;
import com.hust.hustforces.model.dto.common.PaginationInfo;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.dto.discussion.SolutionDetailDto;
import com.hust.hustforces.model.dto.discussion.SolutionDto;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.Solution;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.model.entity.Vote;
import com.hust.hustforces.repository.CommentRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.SolutionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.VoteRepository;
import com.hust.hustforces.service.CommentService;
import com.hust.hustforces.service.SolutionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SolutionServiceImpl implements SolutionService {
    private final SolutionRepository solutionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final CommentService commentService;
    private final VoteRepository voteRepository;
    private final SolutionMapper solutionMapper;

    @Override
    @Transactional
    public SolutionDto createSolution(String code, String description, String userId, String problemId, LanguageId languageId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemId));

        Solution solution = Solution.builder()
                .code(code)
                .description(description)
                .userId(userId)
                .problemId(problemId)
                .languageId(languageId)
                .build();

        Solution savedSolution = solutionRepository.save(solution);

        return solutionMapper.toSolutionDto(savedSolution, user, problem, 0);
    }

    @Override
    @Transactional
    public SolutionDetailDto getSolution(String id, String userId) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", id));

        User user = userRepository.findById(solution.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", solution.getUserId()));

        Problem problem = problemRepository.findById(solution.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", solution.getProblemId()));

        // Get first page of comments with pagination
        Pageable firstPage = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CommentDto> commentPage = commentService.getSolutionComments(id, firstPage);

        SolutionDetailDto detailDto = solutionMapper.toSolutionDetailDto(
                solution, user, problem, commentPage.getContent()
        );

        // Add pagination info
        detailDto.setCommentPagination(new PaginationInfo(
                commentPage.getNumber(),
                commentPage.getSize(),
                commentPage.getTotalElements(),
                commentPage.getTotalPages()
        ));

        return detailDto;
    }

    @Override
    @Transactional
    public SolutionDto updateSolution(String id, String code, String description, String userId) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", id));

        if (!solution.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own solutions");
        }

        solution.setCode(code);
        solution.setDescription(description);

        Solution updatedSolution = solutionRepository.save(solution);

        User user = userRepository.findById(updatedSolution.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updatedSolution.getUserId()));

        Problem problem = problemRepository.findById(updatedSolution.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", updatedSolution.getProblemId()));

        int commentCount = commentRepository.countBySolutionId(id);

        return solutionMapper.toSolutionDto(updatedSolution, user, problem, commentCount);
    }

    @Override
    @Transactional
    public void deleteSolution(String id, String userId) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", id));

        if (!solution.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own solutions");
        }

        solutionRepository.delete(solution);
    }

    @Override
    public Page<SolutionDto> getAllSolutions(Pageable pageable) {
        Page<Solution> solutions = solutionRepository.findAllByOrderByCreatedAtDesc(pageable);

        return solutions.map(solution -> {
            User user = userRepository.findById(solution.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", solution.getUserId()));

            Problem problem = problemRepository.findById(solution.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", solution.getProblemId()));

            int commentCount = commentRepository.countBySolutionId(solution.getId());

            return solutionMapper.toSolutionDto(solution, user, problem, commentCount);
        });
    }

    @Override
    public Page<SolutionDto> getSolutionsByProblem(String problemId, Pageable pageable) {
        Page<Solution> solutions = solutionRepository.findByProblemIdOrderByUpvotesDesc(problemId, pageable);

        return solutions.map(solution -> {
            User user = userRepository.findById(solution.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", solution.getUserId()));

            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemId));

            int commentCount = commentRepository.countBySolutionId(solution.getId());

            return solutionMapper.toSolutionDto(solution, user, problem, commentCount);
        });
    }

    @Override
    public Page<SolutionDto> getSolutionsByUser(String userId, Pageable pageable) {
        Page<Solution> solutions = solutionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return solutions.map(solution -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            Problem problem = problemRepository.findById(solution.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", solution.getProblemId()));

            int commentCount = commentRepository.countBySolutionId(solution.getId());

            return solutionMapper.toSolutionDto(solution, user, problem, commentCount);
        });
    }

    @Override
    @Transactional
    public SolutionDto voteSolution(String id, String userId, boolean isUpvote) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", id));

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if the user has already voted
        Optional<Vote> existingVote = voteRepository.findByUserIdAndEntityIdAndEntityType(
                userId, id, "SOLUTION");

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();

            if (vote.isUpvote() == isUpvote) {
                // User is trying to vote the same way again, remove the vote
                voteRepository.delete(vote);

                if (isUpvote) {
                    solution.setUpvotes(Math.max(0, solution.getUpvotes() - 1));
                } else {
                    solution.setDownvotes(Math.max(0, solution.getDownvotes() - 1));
                }
            } else {
                // User is changing their vote
                vote.setUpvote(isUpvote);
                voteRepository.save(vote);

                if (isUpvote) {
                    solution.setUpvotes(solution.getUpvotes() + 1);
                    solution.setDownvotes(Math.max(0, solution.getDownvotes() - 1));
                } else {
                    solution.setDownvotes(solution.getDownvotes() + 1);
                    solution.setUpvotes(Math.max(0, solution.getUpvotes() - 1));
                }
            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .userId(userId)
                    .entityId(id)
                    .entityType("SOLUTION")
                    .isUpvote(isUpvote)
                    .build();

            voteRepository.save(vote);

            if (isUpvote) {
                solution.setUpvotes(solution.getUpvotes() + 1);
            } else {
                solution.setDownvotes(solution.getDownvotes() + 1);
            }
        }

        Solution updatedSolution = solutionRepository.save(solution);

        User solutionOwner = userRepository.findById(updatedSolution.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updatedSolution.getUserId()));

        Problem problem = problemRepository.findById(updatedSolution.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", updatedSolution.getProblemId()));

        int commentCount = commentRepository.countBySolutionId(id);

        return solutionMapper.toSolutionDto(updatedSolution, solutionOwner, problem, commentCount);
    }
}